import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import {
  checkoutTotalAmount,
  type CartRequestItem,
  type CheckoutLine,
  type CheckoutShippingOption,
} from './checkout.js'
import type { ShopShipping } from './shop.js'

export type ShippingEnvironment = {
  SUPERFRETE_ENV?: string
  SUPERFRETE_TOKEN?: string
  SUPERFRETE_ORIGIN_CEP?: string
  SUPERFRETE_CONTACT_EMAIL?: string
  SHIPPING_SERVICES?: string
  SHIPPING_SERVED_CITIES?: string
  SHIPPING_PICKUP_ADDRESS?: string
  SHIPPING_INSURANCE_MIN_SUBTOTAL_CENTS?: string
  SHIPPING_FALLBACK_CENTS?: string
}

export type ShippingMode = 'sandbox' | 'production'

export type ShippingConfig = {
  mode: ShippingMode
  token: string
  originCep: string
  contactEmail: string
  services: string[]
  servedCities: Set<string>
  pickupAddress: string | null
  insuranceMinCents: number
  fallbackCents: number
}

export type ShippingPackage = {
  weightKg: number
  heightCm: number
  widthCm: number
  lengthCm: number
  box: string
  estimated: boolean
}

export type ShippingQuote = {
  quoteId: string
  options: CheckoutShippingOption[]
  estimated: boolean
  cep: string
  city: string
  state: string
}

export type QuoteShippingResult = { served: false } | ({ served: true } & ShippingQuote)

export type ShippingErrorCode =
  | 'shipping_disabled'
  | 'invalid_cep'
  | 'cep_unavailable'
  | 'quote_unavailable'
  | 'shipping_required'
  | 'shipping_quote_invalid'

export class ShippingError extends Error {
  constructor(public readonly code: ShippingErrorCode) {
    super(code)
  }
}

export type QuotePayload = {
  v: 1
  id: string
  cep: string
  city: string
  state: string
  subtotalCents: number
  options: CheckoutShippingOption[]
  estimated: boolean
  expiresAt: number
  cartHash: string
}

/** Official AMEP list: https://www.amep.pr.gov.br/FAQ/Municipios-da-Regiao-Metropolitana-de-Curitiba */
export const RMC_MUNICIPALITIES = [
  'Curitiba',
  'Adrianópolis',
  'Agudos do Sul',
  'Almirante Tamandaré',
  'Araucária',
  'Balsa Nova',
  'Bocaiúva do Sul',
  'Campina Grande do Sul',
  'Campo do Tenente',
  'Campo Largo',
  'Campo Magro',
  'Cerro Azul',
  'Colombo',
  'Contenda',
  'Doutor Ulysses',
  'Fazenda Rio Grande',
  'Itaperuçu',
  'Lapa',
  'Mandirituba',
  'Piên',
  'Pinhais',
  'Piraquara',
  'Quatro Barras',
  'Rio Branco do Sul',
  'Rio Negro',
  'São José dos Pinhais',
  'Quitandinha',
  'Tijucas do Sul',
  'Tunas do Paraná',
] as const

const DEFAULT_SERVICES = ['1', '2', '17']
const DEFAULT_INSURANCE_MIN_CENTS = 6_000
const QUOTE_TTL_MS = 10 * 60 * 1000
const QUOTE_SECRET_VERSION = 1
const PICKUP_LABELS: Record<string, string> = {
  'en-US': 'Pickup in Colombo (free)',
  'es-ES': 'Recogida en Colombo (gratis)',
}
const SERVICE_LABELS: Record<string, string> = {
  '1': 'PAC',
  '2': 'Sedex',
  '17': 'Mini Envios',
}

const PACKAGING_WEIGHT_G = 50
const BOXES = [
  { id: 'P', maxWeightG: 500, maxItems: 2, heightCm: 15, widthCm: 20, lengthCm: 25, tareG: 50, estimatedWeightG: 300 },
  { id: 'M', maxWeightG: 1_500, maxItems: 5, heightCm: 20, widthCm: 25, lengthCm: 35, tareG: 100, estimatedWeightG: 700 },
  { id: 'G', maxWeightG: 5_000, maxItems: 99, heightCm: 25, widthCm: 35, lengthCm: 45, tareG: 150, estimatedWeightG: 1_200 },
] as const

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normalizeCep(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length === 8 && digits !== '00000000' ? digits : null
}

export function officeCityKey(city: string, state: string) {
  return `${normalize(city)}/${normalize(state)}`
}

function parseServedCities(value: string | undefined) {
  const entries = (value ?? '')
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (entries.length === 0) {
    return new Set(RMC_MUNICIPALITIES.map((city) => officeCityKey(city, 'PR')))
  }
  return new Set(entries.map((entry) => {
    const [city, state = 'PR'] = entry.split('/').map((part) => part.trim())
    return officeCityKey(city, state)
  }))
}

function parseCents(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function shippingConfig(environment: ShippingEnvironment = process.env): ShippingConfig | null {
  const token = environment.SUPERFRETE_TOKEN?.trim()
  const originCep = normalizeCep(environment.SUPERFRETE_ORIGIN_CEP)
  const contactEmail = environment.SUPERFRETE_CONTACT_EMAIL?.trim()
  if (!token || !originCep || !contactEmail) return null

  const services = (environment.SHIPPING_SERVICES?.trim() || DEFAULT_SERVICES.join(','))
    .split(',')
    .map((service) => service.trim())
    .filter((service) => service.length > 0)
  return {
    mode: environment.SUPERFRETE_ENV === 'sandbox' ? 'sandbox' : 'production',
    token,
    originCep,
    contactEmail,
    services: [...new Set(services)],
    servedCities: parseServedCities(environment.SHIPPING_SERVED_CITIES),
    pickupAddress: environment.SHIPPING_PICKUP_ADDRESS?.trim() || null,
    insuranceMinCents: parseCents(environment.SHIPPING_INSURANCE_MIN_SUBTOTAL_CENTS, DEFAULT_INSURANCE_MIN_CENTS),
    fallbackCents: parseCents(environment.SHIPPING_FALLBACK_CENTS, 0),
  }
}

export function shippingEnabled(environment: ShippingEnvironment = process.env) {
  return shippingConfig(environment) !== null
}

export function pickupLabel(locale: unknown) {
  return PICKUP_LABELS[String(locale ?? '')] ?? 'Retirada em Colombo (grátis)'
}

function positiveNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Uses the measured piece when every cell is present; otherwise falls back to
 * the P/M/G box and marks the quote as estimated. Dimensions are not summed.
 */
export function buildShippingPackage(
  lines: CheckoutLine[],
  shipping: Record<string, ShopShipping>,
): ShippingPackage {
  const quantities = lines.reduce((total, line) => total + line.quantity, 0)
  const measured = lines.map((line) => {
    const entry = shipping[line.slug]
    return {
      quantity: line.quantity,
      weightG: positiveNumber(entry?.weightG),
      heightCm: positiveNumber(entry?.heightCm),
      widthCm: positiveNumber(entry?.widthCm),
      lengthCm: positiveNumber(entry?.lengthCm),
    }
  })
  const allMeasured = measured.every((entry) =>
    entry.weightG !== null && entry.heightCm !== null && entry.widthCm !== null && entry.lengthCm !== null)
  const totalWeightG = measured.reduce((total, entry) => total + (entry.weightG ?? 0) * entry.quantity, 0)

  if (quantities === 1 && allMeasured) {
    const item = measured[0]
    return {
      weightKg: Math.max(0.1, Math.round((((item.weightG ?? 0) + PACKAGING_WEIGHT_G) / 1000) * 1000) / 1000),
      heightCm: Math.ceil((item.heightCm ?? 0) + 2),
      widthCm: Math.ceil((item.widthCm ?? 0) + 2),
      lengthCm: Math.ceil((item.lengthCm ?? 0) + 2),
      box: 'item',
      estimated: false,
    }
  }

  const box = BOXES.find((candidate) =>
    quantities <= candidate.maxItems && totalWeightG <= candidate.maxWeightG) ?? BOXES[BOXES.length - 1]
  const estimated = !allMeasured
  const weightG = estimated ? box.estimatedWeightG : totalWeightG + box.tareG
  return {
    weightKg: Math.max(0.1, Math.round((weightG / 1000) * 1000) / 1000),
    heightCm: box.heightCm,
    widthCm: box.widthCm,
    lengthCm: box.lengthCm,
    box: box.id,
    estimated,
  }
}

async function viaCep(cep: string, fetchImpl: typeof fetch): Promise<{ city: string; state: string } | null> {
  try {
    const response = await fetchImpl(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!response.ok) return null
    const data = await response.json() as { erro?: boolean; localidade?: string; uf?: string }
    if (data.erro || !data.localidade || !data.uf) return null
    return { city: data.localidade, state: data.uf }
  } catch {
    return null
  }
}

function isServed(config: ShippingConfig, city: string, state: string) {
  return config.servedCities.has(officeCityKey(city, state))
}

async function superFreteQuote(
  config: ShippingConfig,
  cep: string,
  packageInfo: ShippingPackage,
  subtotalCents: number,
  fetchImpl: typeof fetch,
): Promise<CheckoutShippingOption[]> {
  const base = config.mode === 'sandbox' ? 'https://sandbox.superfrete.com' : 'https://api.superfrete.com'
  const insured = subtotalCents > config.insuranceMinCents
  const response = await fetchImpl(`${base}/api/v0/calculator`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'User-Agent': `Togurumi/1.0 (${config.contactEmail})`,
    },
    body: JSON.stringify({
      from: { postal_code: config.originCep },
      to: { postal_code: cep },
      services: config.services.join(','),
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: insured ? subtotalCents / 100 : 0,
        use_insurance_value: insured,
      },
      package: {
        weight: packageInfo.weightKg,
        height: packageInfo.heightCm,
        width: packageInfo.widthCm,
        length: packageInfo.lengthCm,
      },
    }),
    signal: AbortSignal.timeout(3_000),
  })
  if (!response.ok) throw new ShippingError('quote_unavailable')
  const data = await response.json() as unknown
  if (!Array.isArray(data)) throw new ShippingError('quote_unavailable')

  const options: CheckoutShippingOption[] = []
  for (const raw of data) {
    const entry = raw as Record<string, unknown>
    const id = String(entry.id ?? '').trim()
    const price = Number(String(entry.price ?? '').replace(',', '.'))
    if (!config.services.includes(id) || !Number.isFinite(price) || price <= 0) continue
    const daysValue = Number(entry.delivery_time ?? entry.deliveryTime ?? entry.delivery_time_days)
    const days = Number.isFinite(daysValue) && daysValue > 0 ? Math.ceil(daysValue) : null
    options.push({
      id,
      service: id,
      label: SERVICE_LABELS[id] ?? String(entry.name ?? entry.company ?? `Serviço ${id}`),
      amountCents: Math.round(price * 100),
      minDays: days,
      maxDays: days,
      pickup: false,
    })
  }
  return options.sort((a, b) => a.amountCents - b.amountCents)
}

export function cartHash(items: CartRequestItem[]) {
  const normalized = [...items]
    .map((item) => `${item.slug}\u0000${item.color}\u0000${item.quantity}`)
    .sort()
    .join('\u0001')
  return createHash('sha256').update(normalized).digest('hex')
}

export function createQuoteToken(payload: QuotePayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyQuoteToken(
  token: string,
  secret: string,
  items: CartRequestItem[],
  now = Date.now(),
): QuotePayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as QuotePayload
    if (payload.v !== QUOTE_SECRET_VERSION || payload.expiresAt <= now) return null
    if (payload.cartHash !== cartHash(items)) return null
    return payload
  } catch {
    return null
  }
}

export async function quoteShipping(input: {
  cep: unknown
  items: CartRequestItem[]
  lines: CheckoutLine[]
  shipping: Record<string, ShopShipping>
  config: ShippingConfig
  secret: string
  fetchImpl?: typeof fetch
  now?: number
}): Promise<QuoteShippingResult> {
  const fetchImpl = input.fetchImpl ?? fetch
  const cep = normalizeCep(input.cep)
  if (!cep) throw new ShippingError('invalid_cep')
  const location = await viaCep(cep, fetchImpl)
  if (!location) throw new ShippingError('cep_unavailable')
  if (!isServed(input.config, location.city, location.state)) {
    return { served: false }
  }

  const subtotalCents = checkoutTotalAmount(input.lines)
  const packageInfo = buildShippingPackage(input.lines, input.shipping)
  const options = await superFreteQuote(input.config, cep, packageInfo, subtotalCents, fetchImpl)
    .catch((err: unknown) => {
      if (!(err instanceof ShippingError) || err.code !== 'quote_unavailable') throw err
      if (input.config.fallbackCents > 0) {
        return [{
          id: 'fallback',
          service: 'fallback',
          label: 'Frete padrão',
          amountCents: input.config.fallbackCents,
          minDays: null,
          maxDays: null,
          pickup: false,
        }]
      }
      throw err
    })

  if (input.config.pickupAddress) {
    options.push({
      id: 'pickup',
      service: 'pickup',
      label: 'Retirada em Colombo (grátis)',
      amountCents: 0,
      minDays: null,
      maxDays: null,
      pickup: true,
    })
  }
  if (options.length === 0) throw new ShippingError('quote_unavailable')

  const now = input.now ?? Date.now()
  const payload: QuotePayload = {
    v: 1,
    id: randomUUID(),
    cep,
    city: location.city,
    state: location.state,
    subtotalCents,
    options,
    estimated: packageInfo.estimated,
    expiresAt: now + QUOTE_TTL_MS,
    cartHash: cartHash(input.items),
  }
  return {
    served: true,
    quoteId: createQuoteToken(payload, input.secret),
    options,
    estimated: packageInfo.estimated,
    cep,
    city: location.city,
    state: location.state,
  }
}
