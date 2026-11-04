import type Stripe from 'stripe'
import type { ShopProduct } from './shop.js'

export const MAX_CART_LINES = 20
export const MAX_LINE_QUANTITY = 20
export const CHECKOUT_SOURCE = 'togurumi-shop'

/** Pix codes expire after 30 minutes, which keeps stock reservations short. */
export const PIX_EXPIRES_AFTER_SECONDS = 30 * 60
/** Checkout Session lifetime. Stripe requires at least 30 minutes. */
export const CHECKOUT_SESSION_TTL_SECONDS = 35 * 60
/**
 * How long units stay reserved: a customer may open Pix just before the
 * session expires and then has the full Pix window to pay. Expiry or a failed
 * Pix releases the hold earlier through the webhook.
 */
export const RESERVATION_TTL_SECONDS = CHECKOUT_SESSION_TTL_SECONDS + PIX_EXPIRES_AFTER_SECONDS + 5 * 60

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')
const SINGLE_COLOR_LABELS = new Set(['cor unica', 'single color', 'color unico'])

export type CartRequestItem = {
  slug: string
  color: string
  quantity: number
}

export type CheckoutLine = {
  slug: string
  name: string
  color: string
  quantity: number
  /** Unit price in centavos, taken from the catalog on the server. */
  unitAmount: number
}

export type CheckoutShippingOption = {
  id: string
  service: string
  label: string
  amountCents: number
  minDays: number | null
  maxDays: number | null
  pickup: boolean
}

export type CheckoutErrorCode =
  | 'invalid_cart'
  | 'product_unavailable'
  | 'invalid_color'
  | 'insufficient_stock'

export class CheckoutError extends Error {
  constructor(
    public code: CheckoutErrorCode,
    public details: { slug?: string; available?: number } = {},
  ) {
    super(code)
  }
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

/** Same rules as the storefront (src/lib/slug.ts) so cart slugs match. */
export function slugifyProductName(value: string): string {
  return normalizeText(value)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Same rules as the storefront (src/lib/shop.ts parseProductColors). */
export function productColorOptions(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((color) => color.trim())
    .filter((color) => color && !SINGLE_COLOR_LABELS.has(normalizeText(color)))
}

export function toCents(price: number): number {
  return Math.round(price * 100)
}

/**
 * Validates the untrusted cart payload. Only identifiers and quantities are
 * read: any price or name sent by the browser is ignored.
 */
export function parseCartRequest(body: unknown): CartRequestItem[] {
  const rawItems = (body as { items?: unknown } | null)?.items
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_CART_LINES) {
    throw new CheckoutError('invalid_cart')
  }

  const merged = new Map<string, CartRequestItem>()
  for (const raw of rawItems) {
    const entry = raw as Record<string, unknown> | null
    const slug = typeof entry?.slug === 'string' ? entry.slug.trim() : ''
    const color = typeof entry?.color === 'string' ? entry.color.trim() : ''
    const quantity = entry?.quantity

    if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/.test(slug) || color.length > 100) {
      throw new CheckoutError('invalid_cart')
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new CheckoutError('invalid_cart')
    }

    const key = `${slug}\u0000${color}`
    const existing = merged.get(key)
    if (existing) {
      existing.quantity += quantity
      if (existing.quantity > MAX_LINE_QUANTITY) throw new CheckoutError('invalid_cart')
    } else {
      merged.set(key, { slug, color, quantity })
    }
  }

  return [...merged.values()]
}

/**
 * Resolves each cart line against the catalog: price, colour and stock come
 * from the spreadsheet only. Stock is tracked per product, so quantities of
 * different colours of the same product are added together.
 */
export function buildCheckoutLines(items: CartRequestItem[], products: ShopProduct[]): CheckoutLine[] {
  const catalog = new Map<string, ShopProduct>()
  for (const product of products) {
    if (product.name) catalog.set(slugifyProductName(product.name), product)
  }

  const requestedBySlug = new Map<string, number>()
  const lines: CheckoutLine[] = []

  for (const item of items) {
    const product = catalog.get(item.slug)
    const unitAmount = product ? toCents(product.price) : 0
    if (!product || !Number.isFinite(unitAmount) || unitAmount <= 0) {
      throw new CheckoutError('product_unavailable', { slug: item.slug })
    }

    const colors = productColorOptions(product.cores)
    if (colors.length > 0 ? !colors.includes(item.color) : item.color !== '') {
      throw new CheckoutError('invalid_color', { slug: item.slug })
    }

    const requested = (requestedBySlug.get(item.slug) ?? 0) + item.quantity
    requestedBySlug.set(item.slug, requested)
    const available = Math.max(0, Math.floor(product.stock))
    if (requested > available) {
      throw new CheckoutError(available === 0 ? 'product_unavailable' : 'insufficient_stock', {
        slug: item.slug,
        available,
      })
    }

    lines.push({
      slug: item.slug,
      name: product.name,
      color: item.color,
      quantity: item.quantity,
      unitAmount,
    })
  }

  return lines
}

export function checkoutTotalAmount(lines: CheckoutLine[]): number {
  return lines.reduce((total, line) => total + line.unitAmount * line.quantity, 0)
}

export function stripeCheckoutLocale(locale: unknown): Stripe.Checkout.SessionCreateParams.Locale {
  if (locale === 'en-US') return 'en'
  if (locale === 'es-ES') return 'es'
  return 'pt-BR'
}

export function buildCheckoutSessionParams(
  lines: CheckoutLine[],
  options: {
    siteUrl: string
    locale?: unknown
    reservationId: string
    expiresAt: number
    shipping?: CheckoutShippingOption
    shippingQuoteId?: string
    shippingCep?: string
  },
): Stripe.Checkout.SessionCreateParams {
  const siteUrl = options.siteUrl.replace(/\/+$/, '')
  const metadata: Record<string, string> = {
    source: CHECKOUT_SOURCE,
    reservation_id: options.reservationId,
  }
  if (options.shipping) {
    metadata.shipping_service = options.shipping.pickup ? 'pickup' : options.shipping.service
    metadata.shipping_amount = String(options.shipping.amountCents)
    metadata.shipping_pickup = options.shipping.pickup ? '1' : '0'
    if (options.shippingQuoteId) metadata.shipping_quote_id = options.shippingQuoteId
    if (options.shippingCep) metadata.shipping_cep = options.shippingCep
  }
  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] | undefined = options.shipping
    ? [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: options.shipping.amountCents, currency: 'brl' },
        display_name: options.shipping.label,
        ...(options.shipping.minDays !== null && options.shipping.maxDays !== null
          ? {
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: options.shipping.minDays },
              maximum: { unit: 'business_day' as const, value: options.shipping.maxDays },
            },
          }
          : {}),
      },
    }]
    : undefined

  return {
    mode: 'payment',
    currency: 'brl',
    payment_method_types: ['card', 'pix'],
    payment_method_options: {
      pix: { expires_after_seconds: PIX_EXPIRES_AFTER_SECONDS },
    },
    line_items: lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: 'brl',
        unit_amount: line.unitAmount,
        product_data: {
          name: line.color ? `${line.name} (${line.color})` : line.name,
          metadata: { slug: line.slug, color: line.color },
        },
      },
    })),
    shipping_address_collection: { allowed_countries: ['BR'] },
    ...(shippingOptions ? { shipping_options: shippingOptions } : {}),
    phone_number_collection: { enabled: true },
    locale: stripeCheckoutLocale(options.locale),
    metadata,
    expires_at: options.expiresAt,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  }
}
