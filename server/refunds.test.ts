import assert from 'node:assert/strict'
import test from 'node:test'
import type { OrderRecord } from './orders.js'
import { LocalRefundStore, RefundError, parseRefundRequest, refundEmailMatches } from './refunds.js'

const orderNumber = 'cs_test_a1B2c3D4e5F6'

test('parses a complete refund request and trims the free text', () => {
  const input = parseRefundRequest({
    orderNumber: `  ${orderNumber}  `,
    reason: 'damaged',
    details: '  O braço veio solto.  ',
  })
  assert.deepEqual(input, { sessionId: orderNumber, reason: 'damaged', details: 'O braço veio solto.' })
})

test('rejects malformed order numbers, unknown reasons and oversized details', () => {
  const invalid = [
    { orderNumber: '', reason: 'damaged' },
    { orderNumber: 'cs_test_', reason: 'damaged' },
    { orderNumber: 'pedido-123', reason: 'damaged' },
    { orderNumber, reason: 'porque sim' },
    { orderNumber, reason: 'changed_mind', details: 'x'.repeat(1001) },
    { orderNumber, reason: 'other', details: '   ' },
    { orderNumber, reason: 'other' },
  ]

  for (const body of invalid) {
    assert.throws(() => parseRefundRequest(body), RefundError, JSON.stringify(body))
  }
})

test('only a paid order with the same e-mail can receive a request', () => {
  const buyer = {
    sessionId: orderNumber,
    status: 'paid',
    amountTotal: 8990,
    currency: 'brl',
    paymentIntentId: 'pi_1',
    customerEmail: 'Buyer@Example.com ',
    customerName: 'Buyer',
    customerPhone: null,
    shippingAddress: null,
    items: [],
    stockApplied: true,
    stockIssues: [],
    createdAt: 1,
    updatedAt: 1,
  } satisfies OrderRecord

  assert.equal(refundEmailMatches(buyer, 'buyer@example.com'), true)
  assert.equal(refundEmailMatches(buyer, ' other@example.com '), false)
  assert.equal(refundEmailMatches({ ...buyer, status: 'pending' }, 'buyer@example.com'), false)
  assert.equal(refundEmailMatches({ ...buyer, customerEmail: null }, 'buyer@example.com'), false)
  assert.equal(refundEmailMatches(null, 'buyer@example.com'), false)
})

test('local store keeps one request per order and updates the status', async () => {
  const store = new LocalRefundStore(null, () => 1_000)
  const input = { sessionId: orderNumber, reason: 'changed_mind' as const, details: '' }

  const created = await store.add(input)
  assert.ok(created)
  assert.equal(created.status, 'pending')
  assert.equal(created.createdAt, 1_000)

  assert.equal(await store.add({ ...input, reason: 'damaged' }), null, 'a second request for the same order is ignored')
  assert.equal((await store.list()).length, 1)

  const approved = await store.setStatus(created.id, 'approved')
  assert.equal(approved?.status, 'approved')
  assert.equal(await store.setStatus('missing', 'declined'), null)
})
