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
        metadata: { source: 'togurumi-shop', reservation_id: 'res_order1' },
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

function harness(options: { failStock?: number; failOn?: string; items?: OrderItem[] } = {}) {
  const orderStore = new LocalOrderStore()
  const stockCalls: { slug: string; quantity: number }[] = []
  let failures = options.failStock ?? 0
  const items = options.items ?? ITEMS
  const deps: StripeWebhookDependencies = {
    webhookSecret: WEBHOOK_SECRET,
    constructEvent: (payload, signature, secret) => Stripe.webhooks.constructEvent(payload, signature, secret),
    listLineItems: async () => items.map((item) => ({ ...item })),
    orderStore,
    applyStock: async (slug, quantity): Promise<StockIssue | null> => {
      if (failures > 0 && (!options.failOn || options.failOn === slug)) {
        failures -= 1
        throw new Error('sheet unavailable')
      }
      stockCalls.push({ slug, quantity })
      return null
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

test('webhook stores the shipping amount and flags a CEP mismatch', async () => {
  const { orderStore, deliver } = harness()
  await deliver(sessionEvent('checkout.session.completed', {
    shipping_cost: { amount_total: 2_550 },
    metadata: {
      source: 'togurumi-shop',
      reservation_id: 'res_ship',
      shipping_service: '1',
      shipping_cep: '99999999',
      shipping_amount: '2550',
      shipping_pickup: '0',
    },
  }))
  const order = await orderStore.getOrder('cs_test_order1')
  assert.equal(order?.shippingAmount, 2_550)
  assert.equal(order?.shippingService, '1')
  assert.equal(order?.shippingReview, 'cep_mismatch')
})

test('pickup stores zero shipping and is not a CEP mismatch', async () => {
  const { orderStore, deliver } = harness()
  await deliver(sessionEvent('checkout.session.completed', {
    metadata: {
      source: 'togurumi-shop',
      reservation_id: 'res_pickup',
      shipping_service: 'pickup',
      shipping_cep: '99999999',
      shipping_pickup: '1',
    },
  }))
  const order = await orderStore.getOrder('cs_test_order1')
  assert.equal(order?.shippingAmount, 0)
  assert.equal(order?.shippingService, 'pickup')
  assert.equal(order?.shippingReview, null)
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

test('a webhook redelivered after a partial failure deducts only the missing products', async () => {
  const items: OrderItem[] = [
    ...ITEMS,
    { slug: 'polvo-ollie', name: 'Polvo Ollie', color: '', quantity: 1, unitAmount: 12000 },
    { slug: 'urso-mochi', name: 'Urso Mochi (Azul)', color: 'Azul', quantity: 1, unitAmount: 8990 },
  ]
  const { orderStore, stockCalls, deliver } = harness({ failStock: 1, failOn: 'polvo-ollie', items })
  const event = sessionEvent('checkout.session.completed', {}, 'evt_partial')

  assert.equal((await deliver(event)).status, 500)
  assert.deepEqual(stockCalls, [{ slug: 'urso-mochi', quantity: 3 }], 'colours of one product are deducted together')
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, false)

  assert.equal((await deliver(event)).status, 200)
  assert.deepEqual(stockCalls, [
    { slug: 'urso-mochi', quantity: 3 },
    { slug: 'polvo-ollie', quantity: 1 },
  ])
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, true)

  // A new event for the same session (e.g. a manual resend) does not deduct again.
  await deliver(sessionEvent('checkout.session.async_payment_succeeded', {}, 'evt_partial_again'))
  assert.equal(stockCalls.length, 2)
})

test('stock reservations hold units until paid, expired or failed', async () => {
  const { orderStore, deliver } = harness()
  const stock = { 'urso-mochi': 3 }
  const later = Date.now() + 60_000

  assert.deepEqual(await orderStore.reserveStock('res_order1', [{ slug: 'urso-mochi', quantity: 2 }], stock, later), { ok: true })
  assert.deepEqual(
    await orderStore.reserveStock('res_other', [{ slug: 'urso-mochi', quantity: 2 }], stock, later),
    { ok: false, slug: 'urso-mochi', available: 1 },
  )

  // Session expired without payment: the units become available again.
  const expired = await deliver(sessionEvent('checkout.session.expired', { status: 'expired', payment_status: 'unpaid' }))
  assert.deepEqual(expired.body, { received: true, status: 'expired' })
  assert.equal(await orderStore.getOrder('cs_test_order1'), null)
  assert.deepEqual(await orderStore.reserveStock('res_b', [{ slug: 'urso-mochi', quantity: 3 }], stock, later), { ok: true })

  // A failed Pix releases its hold too.
  const pix = { id: 'cs_test_pix', metadata: { source: 'togurumi-shop', reservation_id: 'res_b' }, payment_status: 'unpaid' }
  await deliver(sessionEvent('checkout.session.completed', pix))
  assert.equal((await orderStore.reserveStock('res_c', [{ slug: 'urso-mochi', quantity: 1 }], stock, later)).ok, false)
  await deliver(sessionEvent('checkout.session.async_payment_failed', pix))
  assert.equal((await orderStore.getOrder('cs_test_pix'))?.status, 'failed')
  assert.deepEqual(await orderStore.reserveStock('res_c', [{ slug: 'urso-mochi', quantity: 3 }], stock, later), { ok: true })
})

test('expired holds and deducted items stop counting as reserved', async () => {
  let now = 1_000_000
  const store = new LocalOrderStore(null, () => now)
  const stock = { 'urso-mochi': 2 }

  assert.equal((await store.reserveStock('res_1', [{ slug: 'urso-mochi', quantity: 2 }], stock, now + 1_000)).ok, true)
  assert.equal((await store.reserveStock('res_2', [{ slug: 'urso-mochi', quantity: 1 }], stock, now + 1_000)).ok, false)
  now += 1_000
  assert.equal((await store.reserveStock('res_2', [{ slug: 'urso-mochi', quantity: 2 }], stock, now + 1_000)).ok, true)

  // Once a product is deducted from the sheet, the sheet itself reflects the sale.
  assert.equal(await store.claimStockItem('res_2', 'cs_2', 'urso-mochi', 2), true)
  assert.equal(await store.claimStockItem('res_2', 'cs_2', 'urso-mochi', 2), false)
  assert.equal((await store.reserveStock('res_3', [{ slug: 'urso-mochi', quantity: 2 }], stock, now + 1_000)).ok, true)
})


test('competing payment events cannot finish stock before a failed writer and its retry', async () => {
  const { deps, orderStore, deliver } = harness()
  let started!: () => void
  let release!: () => void
  const writing = new Promise<void>(resolve => { started = resolve })
  const blocked = new Promise<void>(resolve => { release = resolve })
  let calls = 0
  deps.applyStock = async () => {
    calls += 1
    if (calls === 1) {
      started()
      await blocked
      throw new Error('sheet unavailable')
    }
    return null
  }
  const first = deliver(sessionEvent('checkout.session.completed', {}, 'evt_race_first'))
  await writing
  const second = deliver(sessionEvent('checkout.session.async_payment_succeeded', {}, 'evt_race_second'))
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, false)
  assert.equal(calls, 1, 'the competing event waits for the active sheet writer')
  release()
  assert.equal((await first).status, 500)
  assert.equal((await second).status, 200)
  assert.equal(calls, 2)
  assert.equal((await orderStore.getOrder('cs_test_order1'))?.stockApplied, true)
  assert.equal((await deliver(sessionEvent('checkout.session.completed', {}, 'evt_race_first'))).status, 200)
  assert.equal(calls, 2, 'redelivery never deducts again')
})


test('checkout status has an IP rate limit before contacting Stripe', async () => {
  const { default: app } = await import('./index.js')
  const server = http.createServer(app)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    assert(address && typeof address === 'object')
    const url = `http://127.0.0.1:${address.port}/api/checkout/status?session_id=invalid`
    for (let i = 0; i < 60; i += 1) assert.equal((await fetch(url)).status, 400)
    assert.equal((await fetch(url)).status, 429)
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
