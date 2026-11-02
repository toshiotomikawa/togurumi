import assert from 'node:assert/strict'
import http from 'node:http'
import test from 'node:test'
import Stripe from 'stripe'
import { LocalOrderStore, type OrderItem, type StockIssue } from './orders.js'
import { handleStripeWebhook, lineItemsToOrderItems, type StripeWebhookDependencies } from './stripeWebhook.js'

// Test-only placeholder; real secrets come from STRIPE_WEBHOOK_SECRET.
const WEBHOOK_SECRET = 'whsec_test_placeholder_for_unit_tests'

const ITEMS: OrderItem[] = [
  { slug: 'urso-mochi', name: 'Urso Mochi (Rosa)', color: 'Rosa', quantity: 2, unitAmount: 8990 },
]

function sessionEvent(
  type: string,
  overrides: Record<string, unknown> = {},
  eventId = `evt_${Math.random().toString(36).slice(2)}`,
) {
  return {
    id: eventId,
    object: 'event',
    type,
    api_version: '2026-08-26.dahlia',
    created: 1_700_000_000,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: 'cs_test_order1',
        object: 'checkout.session',
        mode: 'payment',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 17980,
        currency: 'brl',
        payment_intent: 'pi_test_1',
        metadata: { source: 'togurumi-shop' },
        customer_details: { email: 'buyer@example.com', name: 'Test Buyer', phone: '+5500000000000' },
        collected_information: {
          shipping_details: {
            name: 'Test Buyer',
            address: { line1: 'Rua Exemplo, 1', line2: null, city: 'Cidade', state: 'PR', postal_code: '00000-000', country: 'BR' },
          },
        },
        ...overrides,
      },
    },
  }
}

function sign(payload: string, secret = WEBHOOK_SECRET) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret })
}

function harness(options: { failStock?: number } = {}) {
  const orderStore = new LocalOrderStore()
  const stockCalls: OrderItem[][] = []
  let failures = options.failStock ?? 0
  const deps: StripeWebhookDependencies = {
    webhookSecret: WEBHOOK_SECRET,
    constructEvent: (payload, signature, secret) => Stripe.webhooks.constructEvent(payload, signature, secret),
    listLineItems: async () => ITEMS.map((item) => ({ ...item })),
    orderStore,
    applyStock: async (items): Promise<StockIssue[]> => {
      if (failures > 0) {
        failures -= 1
        throw new Error('sheet unavailable')
      }
      stockCalls.push(items)
      return []
    },
    logger: { warn: () => undefined, error: () => undefined },
  }

  async function deliver(event: object, signature?: string) {
    const payload = JSON.stringify(event)
    return handleStripeWebhook(deps, Buffer.from(payload), signature ?? sign(payload))
  }

  return { deps, orderStore, stockCalls, deliver }
}

test('requests without a valid signature are rejected and change nothing', async () => {
  const { deps, orderStore, stockCalls, deliver } = harness()
  const event = sessionEvent('checkout.session.completed')
  const payload = JSON.stringify(event)

  assert.equal((await handleStripeWebhook(deps, Buffer.from(payload), undefined)).status, 400)
  assert.equal((await handleStripeWebhook(deps, payload, sign(payload))).status, 400, 'parsed body is not accepted')
  assert.equal((await deliver(event, 't=1,v1=deadbeef')).status, 400)
  assert.equal((await deliver(event, sign(payload, 'whsec_some_other_secret'))).status, 400)

  const tampered = JSON.stringify({ ...event, data: { object: { ...event.data.object, amount_total: 1 } } })
  const tamperedResult = await handleStripeWebhook(deps, Buffer.from(tampered), sign(payload))
  assert.deepEqual(tamperedResult, { status: 400, body: { error: 'invalid_signature' } })

  assert.equal(await orderStore.getOrder('cs_test_order1'), null)
  assert.equal(stockCalls.length, 0)
})

test('a paid card checkout records the order and lowers stock once, even if redelivered', async () => {
  const { orderStore, stockCalls, deliver } = harness()
  const event = sessionEvent('checkout.session.completed', {}, 'evt_card_paid')

  assert.deepEqual(await deliver(event), { status: 200, body: { received: true, status: 'paid' } })
  assert.deepEqual(await deliver(event), { status: 200, body: { received: true, duplicate: true } })

  const order = await orderStore.getOrder('cs_test_order1')
  assert.ok(order)
  assert.equal(order.status, 'paid')
  assert.equal(order.amountTotal, 17980)
  assert.equal(order.paymentIntentId, 'pi_test_1')
  assert.equal(order.customerEmail, 'buyer@example.com')
  assert.equal(order.shippingAddress?.country, 'BR')
  assert.deepEqual(order.items, ITEMS)
  assert.equal(order.stockApplied, true)
  assert.equal(stockCalls.length, 1)
})

test('Pix stays pending until the async payment succeeds', async () => {
  const { orderStore, stockCalls, deliver } = harness()

  await deliver(sessionEvent('checkout.session.completed', { payment_status: 'unpaid', payment_intent: null }))
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.status, 'pending')
  assert.equal(stockCalls.length, 0)

  const succeeded = sessionEvent('checkout.session.async_payment_succeeded')
  assert.equal((await deliver(succeeded)).body.status, 'paid')
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.status, 'paid')
  assert.equal(stockCalls.length, 1)

  // A different event for the same paid session never takes stock again.
  await deliver(sessionEvent('checkout.session.async_payment_succeeded'))
  assert.equal(stockCalls.length, 1)
})

test('a failed Pix payment marks the order failed without touching stock', async () => {
  const { orderStore, stockCalls, deliver } = harness()
  await deliver(sessionEvent('checkout.session.completed', { payment_status: 'unpaid' }))
  await deliver(sessionEvent('checkout.session.async_payment_failed', { payment_status: 'unpaid' }))
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.status, 'failed')

  // A late, out-of-order "completed" does not resurrect it as pending.
  await deliver(sessionEvent('checkout.session.completed', { payment_status: 'unpaid' }))
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.status, 'failed')
  assert.equal(stockCalls.length, 0)
})

test('out-of-order delivery never downgrades a paid order', async () => {
  const { orderStore, deliver } = harness()
  await deliver(sessionEvent('checkout.session.async_payment_succeeded'))
  await deliver(sessionEvent('checkout.session.completed', { payment_status: 'unpaid' }))
  await deliver(sessionEvent('checkout.session.async_payment_failed'))
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.status, 'paid')
})

test('a processing failure returns 500 and the retried event is applied exactly once', async () => {
  const { orderStore, stockCalls, deliver } = harness({ failStock: 1 })
  const event = sessionEvent('checkout.session.completed', {}, 'evt_retry')

  assert.deepEqual(await deliver(event), { status: 500, body: { error: 'processing_failed' } })
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, false)

  assert.equal((await deliver(event)).status, 200)
  assert.equal((await deliver(event)).body.duplicate, true)
  assert.equal(stockCalls.length, 1)
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, true)
})

test('unrelated events and sessions from other integrations are acknowledged and ignored', async () => {
  const { orderStore, deliver } = harness()
  assert.deepEqual(
    (await deliver({ ...sessionEvent('payment_intent.succeeded'), data: { object: { id: 'pi_1', object: 'payment_intent' } } })).body,
    { received: true, ignored: true },
  )
  assert.deepEqual(
    (await deliver(sessionEvent('checkout.session.completed', { metadata: {} }))).body,
    { received: true, ignored: true },
  )
  assert.equal(await orderStore.getOrder('cs_test_order1'), null)
})

test('line items keep the catalog slug and colour from product metadata', () => {
  const items = lineItemsToOrderItems([
    {
      description: 'Urso Mochi (Rosa)',
      quantity: 2,
      price: { unit_amount: 8990, product: { object: 'product', metadata: { slug: 'urso-mochi', color: 'Rosa' } } },
    },
    { description: 'Deleted', quantity: 1, price: { unit_amount: 100, product: 'prod_1' } },
  ] as unknown as Stripe.LineItem[])
  assert.deepEqual(items, [
    ITEMS[0],
    { slug: '', name: 'Deleted', color: '', quantity: 1, unitAmount: 100 },
  ])
})

test('the Express route verifies the signature against the raw request body', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_for_unit_tests'
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
  const { default: app } = await import('./index.js')
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  try {
    const address = server.address()
    assert(address && typeof address === 'object')
    const url = `http://127.0.0.1:${address.port}/api/stripe/webhook`
    // Spacing differs from JSON.stringify output: re-serialising the body would break the signature.
    const payload = JSON.stringify(sessionEvent('customer.created'), null, 2)

    const unsigned = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload })
    assert.equal(unsigned.status, 400)

    const forged = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'stripe-signature': sign(payload, 'whsec_wrong') },
      body: payload,
    })
    assert.equal(forged.status, 400)

    const signed = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'stripe-signature': sign(payload) },
      body: payload,
    })
    assert.equal(signed.status, 200)
    assert.deepEqual(await signed.json(), { received: true, ignored: true })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
  }
})
