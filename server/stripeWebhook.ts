import type Stripe from 'stripe'
import { CHECKOUT_SOURCE } from './checkout.js'
import type { OrderItem, OrderRecord, OrderStatus, OrderStore, ShippingAddress, StockIssue } from './orders.js'

export const HANDLED_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
])

export type StripeWebhookDependencies = {
  webhookSecret: string
  /** Verifies the Stripe-Signature header against the raw body (stripe.webhooks.constructEvent). */
  constructEvent: (payload: Buffer, signature: string, secret: string) => Stripe.Event
  listLineItems: (sessionId: string) => Promise<OrderItem[]>
  orderStore: OrderStore
  /** Deducts one product's sold quantity from the sheet; returns a shortfall, if any. */
  applyStock: (slug: string, quantity: number) => Promise<StockIssue | null>
  logger?: Pick<Console, 'warn' | 'error'>
}

export type StripeWebhookResult = {
  status: number
  body: Record<string, unknown>
}

function sessionStatus(eventType: string, session: Stripe.Checkout.Session): OrderStatus {
  if (eventType === 'checkout.session.async_payment_failed') return 'failed'
  if (eventType === 'checkout.session.async_payment_succeeded') return 'paid'
  // checkout.session.completed: card payments arrive paid, Pix arrives unpaid
  // and is settled later by async_payment_succeeded or async_payment_failed.
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    ? 'paid'
    : 'pending'
}

function shippingAddress(session: Stripe.Checkout.Session): ShippingAddress | null {
  const shipping = session.collected_information?.shipping_details
  if (!shipping?.address) return null
  return {
    name: shipping.name ?? null,
    line1: shipping.address.line1 ?? null,
    line2: shipping.address.line2 ?? null,
    city: shipping.address.city ?? null,
    state: shipping.address.state ?? null,
    postalCode: shipping.address.postal_code ?? null,
    country: shipping.address.country ?? null,
  }
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  const value = session.payment_intent
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

/** Checkouts created by this site carry a reservation id; older ones fall back to the session id. */
export function reservationIdOf(session: Stripe.Checkout.Session) {
  return session.metadata?.reservation_id || session.id
}

/**
 * Deducts each product of a paid order at most once. Every product is claimed
 * separately, so a webhook redelivered after a partial failure only deducts
 * what is still missing.
 */
async function applyOrderStock(deps: StripeWebhookDependencies, reservationId: string, order: OrderRecord) {
  const totals = new Map<string, number>()
  for (const item of order.items) {
    if (item.slug) totals.set(item.slug, (totals.get(item.slug) ?? 0) + item.quantity)
  }

  for (const [slug, quantity] of totals) {
    await deps.orderStore.withStockLock(slug, async (store) => {
      // A competing event only sees the claim after the sheet update commits.
      if (!await store.claimStockItem(reservationId, order.sessionId, slug, quantity)) return
      let issue: StockIssue | null
      try {
        issue = await deps.applyStock(slug, quantity)
      } catch (err) {
        await store.releaseStockItem(reservationId, slug)
        throw err
      }
      if (issue) {
        await store.recordStockIssues(order.sessionId, [issue])
        deps.logger?.warn(`[stripe] order ${order.sessionId} exceeded available stock`, issue)
      }
    })
  }

  await deps.orderStore.markStockApplied(order.sessionId)
  await deps.orderStore.releaseReservation(reservationId)
}

async function processSessionEvent(
  deps: StripeWebhookDependencies,
  eventType: string,
  session: Stripe.Checkout.Session,
) {
  const items = await deps.listLineItems(session.id)
  const order = await deps.orderStore.upsertOrder({
    sessionId: session.id,
    status: sessionStatus(eventType, session),
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? 'brl',
    paymentIntentId: paymentIntentId(session),
    customerEmail: session.customer_details?.email ?? null,
    customerName: session.customer_details?.name ?? null,
    customerPhone: session.customer_details?.phone ?? null,
    shippingAddress: shippingAddress(session),
    items,
  })

  if (order.status === 'paid' && !order.stockApplied) {
    await applyOrderStock(deps, reservationIdOf(session), order)
  } else if (order.status === 'failed') {
    await deps.orderStore.releaseReservation(reservationIdOf(session))
  }

  return order
}

export async function handleStripeWebhook(
  deps: StripeWebhookDependencies,
  rawBody: unknown,
  signature: unknown,
): Promise<StripeWebhookResult> {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string' || !signature) {
    return { status: 400, body: { error: 'invalid_signature' } }
  }

  let event: Stripe.Event
  try {
    event = deps.constructEvent(rawBody, signature, deps.webhookSecret)
  } catch {
    return { status: 400, body: { error: 'invalid_signature' } }
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return { status: 200, body: { received: true, ignored: true } }
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.object !== 'checkout.session' || session.metadata?.source !== CHECKOUT_SOURCE) {
    return { status: 200, body: { received: true, ignored: true } }
  }

  if (!await deps.orderStore.claimEvent(event.id, event.type)) {
    return { status: 200, body: { received: true, duplicate: true } }
  }

  try {
    if (event.type === 'checkout.session.expired') {
      // The customer never paid: give the held units back to the shop.
      await deps.orderStore.releaseReservation(reservationIdOf(session))
      return { status: 200, body: { received: true, status: 'expired' } }
    }
    const order = await processSessionEvent(deps, event.type, session)
    return { status: 200, body: { received: true, status: order.status } }
  } catch (err) {
    // Let Stripe retry: the event is only remembered once it was fully handled.
    await deps.orderStore.releaseEvent(event.id)
    deps.logger?.error(`[stripe] failed to process ${event.type} ${event.id}`, err)
    return { status: 500, body: { error: 'processing_failed' } }
  }
}

/** Maps Checkout line items (with expanded products) to order items. */
export function lineItemsToOrderItems(lineItems: Stripe.LineItem[]): OrderItem[] {
  return lineItems.map((lineItem) => {
    const product = lineItem.price?.product
    const metadata = product && typeof product === 'object' && !('deleted' in product && product.deleted)
      ? (product as Stripe.Product).metadata
      : {}
    return {
      slug: metadata.slug ?? '',
      name: lineItem.description ?? '',
      color: metadata.color ?? '',
      quantity: lineItem.quantity ?? 0,
      unitAmount: lineItem.price?.unit_amount ?? 0,
    }
  })
}
