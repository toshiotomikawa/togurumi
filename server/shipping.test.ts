import assert from 'node:assert/strict'
import test from 'node:test'
import type { CartRequestItem, CheckoutLine } from './checkout.js'
import type { ShopShipping } from './shop.js'
import {
  RMC_MUNICIPALITIES,
  ShippingError,
  buildShippingPackage,
  officeCityKey,
  quoteShipping,
  shippingConfig,
  shippingEnabled,
  verifyQuoteToken,
  type ShippingConfig,
} from './shipping.js'
import { getShopShipping } from './shop.js'

function config(overrides: Partial<ShippingConfig> = {}): ShippingConfig {
  return {
    mode: 'sandbox',
    token: 'token',
    originCep: '12345678',
    contactEmail: 'shop@example.com',
    services: ['1', '2', '17'],
    servedCities: new Set([officeCityKey('Curitiba', 'PR')]),
    pickupAddress: 'Rua do Ponto, 1',
    insuranceMinCents: 6_000,
    fallbackCents: 0,
    ...overrides,
  }
}

const items: CartRequestItem[] = [{ slug: 'abelha', color: '', quantity: 1 }]
const lines: CheckoutLine[] = [{ slug: 'abelha', name: 'Abelha', color: '', quantity: 1, unitAmount: 3_500 }]
const shipping: Record<string, ShopShipping> = {
  abelha: { weightG: 200, heightCm: 10, widthCm: 10, lengthCm: 10 },
}

type Call = { url: string; body?: Record<string, unknown> }

function fakeFetch(options: {
  city?: string
  uf?: string
  services?: unknown
  failFrete?: boolean
} = {}) {
  const freteCalls: Call[] = []
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('viacep.com.br')) {
      return new Response(JSON.stringify({ localidade: options.city ?? 'Curitiba', uf: options.uf ?? 'PR' }), { status: 200 })
    }
    if (url.includes('superfrete.com')) {
      freteCalls.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined,
      })
      if (options.failFrete) return new Response('{}', { status: 502 })
      return new Response(JSON.stringify(options.services ?? []), { status: 200 })
    }
    return new Response('{}', { status: 404 })
  }) as typeof fetch
  return { impl, freteCalls }
}

const services = [
  { id: 1, price: 25.5, delivery_time: 5, name: 'PAC' },
  { id: 2, price: 40, delivery_time: 3, name: 'Sedex' },
  { id: 17, price: 15, delivery_time: 8, name: 'Mini Envios' },
]

test('RMC default list keeps the 29 official municipalities', () => {
  assert.equal(RMC_MUNICIPALITIES.length, 29)
  const parsed = shippingConfig({
    SUPERFRETE_TOKEN: 'token',
    SUPERFRETE_ORIGIN_CEP: '12.345-678',
    SUPERFRETE_CONTACT_EMAIL: 'shop@example.com',
  })
  assert.ok(parsed)
  assert.equal(parsed.originCep, '12345678')
  assert.equal(parsed.services.join(','), '1,2,17')
  assert.equal(parsed.servedCities.size, 29)
  assert.equal(parsed.servedCities.has(officeCityKey('Quitandinha', 'PR')), true)
  assert.equal(parsed.pickupAddress, null)
  assert.equal(parsed.insuranceMinCents, 6_000)
})

test('shipping is disabled without the SuperFrete token, origin CEP and contact e-mail', () => {
  assert.equal(shippingConfig({}), null)
  assert.equal(shippingEnabled({}), false)
  assert.equal(shippingConfig({
    SUPERFRETE_TOKEN: 'token',
    SUPERFRETE_ORIGIN_CEP: '12345678',
  }), null)
})

test('custom served cities replace the default and are normalized', () => {
  const parsed = shippingConfig({
    SUPERFRETE_TOKEN: 'token',
    SUPERFRETE_ORIGIN_CEP: '12345678',
    SUPERFRETE_CONTACT_EMAIL: 'shop@example.com',
    SHIPPING_SERVED_CITIES: 'Curitiba/PR, São José dos Pinhais/pr',
  })
  assert.ok(parsed)
  assert.equal(parsed.servedCities.size, 2)
  assert.equal(parsed.servedCities.has(officeCityKey('Sao Jose dos Pinhais', 'PR')), true)
})

test('package uses measured dimensions for one piece and a box for several', () => {
  const one = buildShippingPackage(lines, shipping)
  assert.deepEqual(one, {
    weightKg: 0.25,
    heightCm: 12,
    widthCm: 12,
    lengthCm: 12,
    box: 'item',
    estimated: false,
  })

  const several = buildShippingPackage([
    { ...lines[0], quantity: 2 },
    { ...lines[0], slug: 'polvo', quantity: 3 },
  ], {
    abelha: { weightG: 100, heightCm: 10, widthCm: 10, lengthCm: 10 },
    polvo: { weightG: 100, heightCm: 10, widthCm: 10, lengthCm: 10 },
  })
  assert.deepEqual(several, {
    weightKg: 0.6,
    heightCm: 20,
    widthCm: 25,
    lengthCm: 35,
    box: 'M',
    estimated: false,
  })
})

test('missing measurements fall back to the P/M/G box and mark it estimated', () => {
  const result = buildShippingPackage(lines, {})
  assert.deepEqual(result, {
    weightKg: 0.3,
    heightCm: 15,
    widthCm: 20,
    lengthCm: 25,
    box: 'P',
    estimated: true,
  })
})

test('getShopShipping reads the four columns and leaves empty cells undefined', async () => {
  const result = await getShopShipping({
    getRows: async () => [
      {
        MODELO: 'Abelha',
        PESO_G: '250',
        ALTURA_CM: '10',
        LARGURA_CM: '12',
        COMPRIMENTO_CM: '18',
      },
      { MODELO: 'Bebê baleia', PESO_G: '', ALTURA_CM: '0', LARGURA_CM: 'x', COMPRIMENTO_CM: '20' },
    ],
  })
  assert.deepEqual(result['abelha'], {
    weightG: 250,
    heightCm: 10,
    widthCm: 12,
    lengthCm: 18,
  })
  assert.deepEqual(result['bebe-baleia'], {
    weightG: undefined,
    heightCm: undefined,
    widthCm: undefined,
    lengthCm: 20,
  })
})

test('quote offers the returned services, the free pickup and a verifiable token', async () => {
  const { impl, freteCalls } = fakeFetch({ services })
  const result = await quoteShipping({
    cep: '80000-000',
    items,
    lines,
    shipping,
    config: config(),
    secret: 'quote-secret',
    fetchImpl: impl,
    now: 1_700_000_000_000,
  })
  if (!result.served) throw new Error('expected a served quote')
  assert.deepEqual(result.options.map((option) => option.id), ['17', '1', '2', 'pickup'])
  assert.equal(result.options[0].amountCents, 1_500)
  assert.equal(result.options[0].minDays, 8)
  assert.equal(result.options[3].amountCents, 0)
  assert.equal(freteCalls.length, 1)
  assert.equal(freteCalls[0].body?.services, '1,2,17')
  assert.equal(((freteCalls[0].body?.package as Record<string, unknown>).weight), 0.25)

  const payload = verifyQuoteToken(result.quoteId, 'quote-secret', items, 1_700_000_000_001)
  assert.ok(payload)
  assert.equal(payload.options.length, 4)
  assert.equal(verifyQuoteToken(`${result.quoteId.slice(0, -1)}x`, 'quote-secret', items), null)
  assert.equal(verifyQuoteToken(result.quoteId, 'quote-secret', [{ ...items[0], quantity: 2 }]), null)
  assert.equal(verifyQuoteToken(result.quoteId, 'quote-secret', items, 1_700_000_600_001), null)
})

test('outside the served area returns served false without calling SuperFrete', async () => {
  const { impl, freteCalls } = fakeFetch({ city: 'São Paulo', uf: 'SP', services })
  const result = await quoteShipping({
    cep: '01000-000',
    items,
    lines,
    shipping,
    config: config(),
    secret: 'quote-secret',
    fetchImpl: impl,
  })
  assert.deepEqual(result, { served: false })
  assert.equal(freteCalls.length, 0)
})

test('invalid CEP is rejected before any network call', async () => {
  const { impl, freteCalls } = fakeFetch({ services })
  await assert.rejects(
    () => quoteShipping({
      cep: '123',
      items,
      lines,
      shipping,
      config: config(),
      secret: 'quote-secret',
      fetchImpl: impl,
    }),
    (err: unknown) => err instanceof ShippingError && err.code === 'invalid_cep',
  )
  assert.equal(freteCalls.length, 0)
})

test('insurance is sent only above the configured product subtotal', async () => {
  const below = fakeFetch({ services })
  await quoteShipping({
    cep: '80000-000',
    items,
    lines: [{ ...lines[0], unitAmount: 6_000 }],
    shipping,
    config: config(),
    secret: 'quote-secret',
    fetchImpl: below.impl,
  })
  assert.deepEqual(below.freteCalls[0].body?.options, {
    own_hand: false,
    receipt: false,
    insurance_value: 0,
    use_insurance_value: false,
  })

  const above = fakeFetch({ services })
  await quoteShipping({
    cep: '80000-000',
    items,
    lines: [{ ...lines[0], unitAmount: 6_001 }],
    shipping,
    config: config(),
    secret: 'quote-secret',
    fetchImpl: above.impl,
  })
  assert.deepEqual(above.freteCalls[0].body?.options, {
    own_hand: false,
    receipt: false,
    insurance_value: 60.01,
    use_insurance_value: true,
  })
})

test('SuperFrete failure uses the configured fallback and still offers pickup', async () => {
  const { impl } = fakeFetch({ services, failFrete: true })
  const result = await quoteShipping({
    cep: '80000-000',
    items,
    lines,
    shipping,
    config: config({ fallbackCents: 1_990 }),
    secret: 'quote-secret',
    fetchImpl: impl,
  })
  if (!result.served) throw new Error('expected a served quote')
  assert.deepEqual(result.options.map((option) => option.id), ['fallback', 'pickup'])
  assert.equal(result.options[0].amountCents, 1_990)
  assert.equal(result.options[1].pickup, true)
})
