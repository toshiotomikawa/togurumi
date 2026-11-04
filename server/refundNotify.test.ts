import assert from 'node:assert/strict'
import test from 'node:test'
import type { OrderRecord } from './orders.js'
import type { RefundRequestRecord } from './refunds.js'
import {
  RESEND_ENDPOINT,
  buildRefundNotification,
  refundNotificationConfig,
  sendRefundNotification,
} from './refundNotify.js'

const order: OrderRecord = {
  sessionId: 'cs_test_a1B2c3D4e5F6',
  status: 'paid',
  amountTotal: 17980,
  currency: 'brl',
  paymentIntentId: 'pi_1',
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  customerPhone: null,
  shippingAddress: null,
  items: [{ slug: 'urso-mochi', name: 'Urso Mochi', color: 'Rosa', quantity: 2, unitAmount: 8990 }],
  stockApplied: true,
  stockIssues: [],
  createdAt: 1,
  updatedAt: 1,
}

const request: RefundRequestRecord = {
  id: 'f2f3a9c4-0000-4000-8000-000000000001',
  sessionId: order.sessionId,
  reason: 'damaged',
  details: 'O braço veio solto.',
  status: 'pending',
  createdAt: 2,
  updatedAt: 2,
}

test('notifications stay disabled until both variables exist', () => {
  assert.equal(refundNotificationConfig({}), null)
  assert.equal(refundNotificationConfig({ RESEND_API_KEY: 're_key' }), null)
  assert.equal(refundNotificationConfig({ REFUND_NOTIFY_EMAIL: 'bella@example.com' }), null)
  assert.deepEqual(
    refundNotificationConfig({ RESEND_API_KEY: 're_key', REFUND_NOTIFY_EMAIL: 'bella@example.com' }),
    { apiKey: 're_key', to: 'bella@example.com', from: 'Togurumi <onboarding@resend.dev>' },
  )
  assert.equal(
    refundNotificationConfig({
      RESEND_API_KEY: 're_key',
      REFUND_NOTIFY_EMAIL: 'bella@example.com',
      REFUND_EMAIL_FROM: 'Togurumi <pedidos@togurumi.com>',
    })?.from,
    'Togurumi <pedidos@togurumi.com>',
  )
})

test('the e-mail carries the order, reason and admin link', () => {
  const { subject, text } = buildRefundNotification(request, order, 'https://togurumi.example/admin/refunds')
  assert.match(subject, /reembolso/i)
  assert.match(text, /cs_test_a1B2c3D4e5F6/)
  assert.match(text, /Test Buyer · buyer@example\.com/)
  assert.match(text, /2x Urso Mochi \(Rosa\)/)
  assert.match(text, /Peça chegou danificada/)
  assert.match(text, /O braço veio solto\./)
  assert.match(text, /https:\/\/togurumi\.example\/admin\/refunds/)
})

test('sends through Resend and fails loudly on a rejected request', async () => {
  const calls: { url: string; init?: RequestInit }[] = []
  const okFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    return new Response('{}', { status: 200 })
  }) as typeof fetch

  await sendRefundNotification(
    { apiKey: 're_key', to: 'bella@example.com', from: 'Togurumi <onboarding@resend.dev>' },
    request,
    order,
    'https://togurumi.example/admin/refunds',
    okFetch,
  )

  assert.equal(calls[0]?.url, RESEND_ENDPOINT)
  assert.equal(calls[0]?.init?.method, 'POST')
  const headers = calls[0]?.init?.headers as Record<string, string>
  assert.equal(headers.Authorization, 'Bearer re_key')
  const body = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>
  assert.deepEqual(body.to, ['bella@example.com'])
  assert.equal(body.reply_to, 'buyer@example.com')
  assert.match(String(body.subject), /reembolso/i)

  const failingFetch = (async () => new Response('{}', { status: 500 })) as typeof fetch
  await assert.rejects(
    sendRefundNotification(
      { apiKey: 're_key', to: 'bella@example.com', from: 'Togurumi <onboarding@resend.dev>' },
      request,
      order,
      'https://togurumi.example/admin/refunds',
      failingFetch,
    ),
    /resend_500/,
  )
})
