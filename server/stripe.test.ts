import assert from 'node:assert/strict'
import test from 'node:test'

test('the Stripe client keeps sending the Dahlia API version used by Checkout', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_linus'
  const { getStripe } = await import('./stripe.js')
  const stripe = getStripe() as unknown as { getApiField: (field: string) => unknown }

  assert.equal(
    stripe.getApiField('version'),
    '2026-08-26.dahlia',
    'payment_method_types is only valid on the Dahlia version used to create Checkout Sessions',
  )
})
