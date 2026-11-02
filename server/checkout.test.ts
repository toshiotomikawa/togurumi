import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CheckoutError,
  MAX_CART_LINES,
  buildCheckoutLines,
  buildCheckoutSessionParams,
  checkoutTotalAmount,
  parseCartRequest,
  slugifyProductName,
  toCents,
} from './checkout.js'
import type { ShopProduct } from './shop.js'

function product(overrides: Partial<ShopProduct>): ShopProduct {
  return {
    name: 'Urso Mochi',
    category: 'Amigurumi',
    price: 89.9,
    yarn: 'Algodão',
    cores: 'Rosa, Azul',
    stock: 3,
    description: '',
    image: '',
    imagesByColor: {},
    releaseDate: '',
    highlight: false,
    designer: '',
    ...overrides,
  }
}

const catalog = [
  product({}),
  product({ name: 'Polvo Ollie', price: 120, cores: 'Cor única', stock: 1 }),
  product({ name: 'Coelho Clover', price: 45.5, cores: '', stock: 0 }),
  product({ name: 'Brinde', price: 0, cores: '', stock: 10 }),
]

function assertCheckoutError(fn: () => unknown, code: string, details: Record<string, unknown> = {}) {
  assert.throws(fn, (err: unknown) => {
    assert.ok(err instanceof CheckoutError)
    assert.equal(err.code, code)
    for (const [key, value] of Object.entries(details)) {
      assert.equal((err.details as Record<string, unknown>)[key], value)
    }
    return true
  })
}

test('slugs and cents follow the storefront rules', () => {
  assert.equal(slugifyProductName('Polvo Ollie'), 'polvo-ollie')
  assert.equal(slugifyProductName('  Pão de Mel!  '), 'pao-de-mel')
  assert.equal(toCents(89.9), 8990)
  assert.equal(toCents(0.1 + 0.2), 30)
})

test('cart payload ignores client prices and merges duplicate lines', () => {
  const items = parseCartRequest({
    items: [
      { slug: 'urso-mochi', color: 'Rosa', quantity: 1, price: 0.01, name: 'Free' },
      { slug: 'urso-mochi', color: 'Rosa', quantity: 1 },
      { slug: 'polvo-ollie', quantity: 1 },
    ],
  })
  assert.deepEqual(items, [
    { slug: 'urso-mochi', color: 'Rosa', quantity: 2 },
    { slug: 'polvo-ollie', color: '', quantity: 1 },
  ])
})

test('malformed carts are rejected', () => {
  const invalid: unknown[] = [
    null,
    {},
    { items: [] },
    { items: 'urso-mochi' },
    { items: [{ slug: 'urso-mochi', quantity: 0 }] },
    { items: [{ slug: 'urso-mochi', quantity: 1.5 }] },
    { items: [{ slug: 'urso-mochi', quantity: '2' }] },
    { items: [{ slug: 'urso-mochi', quantity: 21 }] },
    { items: [{ slug: 'Urso Mochi', quantity: 1 }] },
    { items: [{ slug: 'urso-mochi', quantity: 15 }, { slug: 'urso-mochi', quantity: 15 }] },
    { items: Array.from({ length: MAX_CART_LINES + 1 }, (_, i) => ({ slug: `p-${i}`, quantity: 1 })) },
  ]
  for (const body of invalid) assertCheckoutError(() => parseCartRequest(body), 'invalid_cart')
})

test('line items use catalog prices and the total is computed in centavos', () => {
  const lines = buildCheckoutLines(
    [
      { slug: 'urso-mochi', color: 'Rosa', quantity: 1 },
      { slug: 'urso-mochi', color: 'Azul', quantity: 2 },
      { slug: 'polvo-ollie', color: '', quantity: 1 },
    ],
    catalog,
  )
  assert.deepEqual(lines, [
    { slug: 'urso-mochi', name: 'Urso Mochi', color: 'Rosa', quantity: 1, unitAmount: 8990 },
    { slug: 'urso-mochi', name: 'Urso Mochi', color: 'Azul', quantity: 2, unitAmount: 8990 },
    { slug: 'polvo-ollie', name: 'Polvo Ollie', color: '', quantity: 1, unitAmount: 12000 },
  ])
  assert.equal(checkoutTotalAmount(lines), 8990 * 3 + 12000)
})

test('stock is validated per product across colours', () => {
  assert.doesNotThrow(() => buildCheckoutLines([{ slug: 'urso-mochi', color: 'Rosa', quantity: 3 }], catalog))
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'urso-mochi', color: 'Rosa', quantity: 4 }], catalog),
    'insufficient_stock',
    { slug: 'urso-mochi', available: 3 },
  )
  assertCheckoutError(
    () => buildCheckoutLines(
      [
        { slug: 'urso-mochi', color: 'Rosa', quantity: 2 },
        { slug: 'urso-mochi', color: 'Azul', quantity: 2 },
      ],
      catalog,
    ),
    'insufficient_stock',
    { slug: 'urso-mochi', available: 3 },
  )
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'coelho-clover', color: '', quantity: 1 }], catalog),
    'product_unavailable',
    { slug: 'coelho-clover', available: 0 },
  )
})

test('unknown, unpriced and wrongly coloured products are refused', () => {
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'dragao', color: '', quantity: 1 }], catalog),
    'product_unavailable',
    { slug: 'dragao' },
  )
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'brinde', color: '', quantity: 1 }], catalog),
    'product_unavailable',
  )
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'urso-mochi', color: 'Verde', quantity: 1 }], catalog),
    'invalid_color',
  )
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'urso-mochi', color: '', quantity: 1 }], catalog),
    'invalid_color',
  )
  assertCheckoutError(
    () => buildCheckoutLines([{ slug: 'polvo-ollie', color: 'Rosa', quantity: 1 }], catalog),
    'invalid_color',
  )
})

test('Checkout Session params use BRL, card and Pix, Brazilian shipping and phone', () => {
  const lines = buildCheckoutLines([{ slug: 'urso-mochi', color: 'Rosa', quantity: 2 }], catalog)
  const params = buildCheckoutSessionParams(lines, { siteUrl: 'https://shop.example/', locale: 'es-ES' })

  assert.equal(params.mode, 'payment')
  assert.equal(params.currency, 'brl')
  assert.deepEqual(params.payment_method_types, ['card', 'pix'])
  assert.deepEqual(params.shipping_address_collection, { allowed_countries: ['BR'] })
  assert.deepEqual(params.phone_number_collection, { enabled: true })
  assert.equal(params.locale, 'es')
  assert.equal(params.metadata?.source, 'togurumi-shop')
  assert.equal(params.success_url, 'https://shop.example/checkout/success?session_id={CHECKOUT_SESSION_ID}')
  assert.equal(params.cancel_url, 'https://shop.example/checkout/cancel')
  assert.deepEqual(params.line_items, [{
    quantity: 2,
    price_data: {
      currency: 'brl',
      unit_amount: 8990,
      product_data: { name: 'Urso Mochi (Rosa)', metadata: { slug: 'urso-mochi', color: 'Rosa' } },
    },
  }])
  assert.equal(buildCheckoutSessionParams(lines, { siteUrl: 'https://shop.example' }).locale, 'pt-BR')
})
