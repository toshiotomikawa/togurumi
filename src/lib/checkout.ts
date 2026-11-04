import type { CartItem } from '../context/cart'

export type CheckoutFailure = {
  error: string
  slug?: string
  available?: number
}

export type CheckoutStatus = 'paid' | 'pending' | 'failed' | 'expired' | 'open'

export type ShippingOption = {
  id: string
  service: string
  label: string
  amountCents: number
  minDays: number | null
  maxDays: number | null
  pickup: boolean
}

export type ShippingQuote = {
  quoteId: string
  options: ShippingOption[]
  estimated: boolean
}

export type ShippingQuoteResult = { served: false } | ({ served: true } & ShippingQuote)

export type ShippingStatus = {
  enabled: boolean
  pickup: boolean
}

export type CheckoutStatusResult = {
  status: CheckoutStatus
  shippingService: string | null
  pickupAddress: string | null
}

export class CheckoutRequestError extends Error {
  readonly failure: CheckoutFailure

  constructor(failure: CheckoutFailure) {
    super(failure.error)
    this.failure = failure
  }
}

/**
 * Asks the API for a Stripe Checkout URL. Only product identifiers, colours
 * and quantities are sent: prices are always recalculated on the server.
 */
export async function startCheckout(
  items: CartItem[],
  locale: string,
  shipping?: { quoteId: string; optionId: string },
): Promise<string> {
  let response: Response
  try {
    response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        locale,
        items: items.map((item) => ({ slug: item.slug, color: item.color ?? '', quantity: item.quantity })),
        ...(shipping ? { shipping } : {}),
      }),
    })
  } catch {
    throw new CheckoutRequestError({ error: 'network' })
  }

  const data = (await response.json().catch(() => ({}))) as Partial<CheckoutFailure> & { url?: string }
  if (!response.ok || typeof data.url !== 'string') {
    throw new CheckoutRequestError({
      error: typeof data.error === 'string' ? data.error : 'checkout_failed',
      slug: data.slug,
      available: data.available,
    })
  }
  return data.url
}

export async function fetchShippingStatus(): Promise<ShippingStatus> {
  try {
    const response = await fetch('/api/shipping/status', { cache: 'no-store' })
    if (!response.ok) return { enabled: false, pickup: false }
    const data = (await response.json()) as { enabled?: unknown; pickup?: unknown }
    return { enabled: Boolean(data.enabled), pickup: Boolean(data.pickup) }
  } catch {
    return { enabled: false, pickup: false }
  }
}

export async function requestShippingQuote(cep: string, items: CartItem[]): Promise<ShippingQuoteResult> {
  let response: Response
  try {
    response = await fetch('/api/shipping/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        cep,
        items: items.map((item) => ({ slug: item.slug, color: item.color ?? '', quantity: item.quantity })),
      }),
    })
  } catch {
    throw new CheckoutRequestError({ error: 'network' })
  }

  const data = (await response.json().catch(() => ({}))) as Partial<CheckoutFailure> & {
    ok?: boolean
    served?: boolean
    quoteId?: string
    options?: ShippingOption[]
    estimated?: boolean
  }
  if (!response.ok || data.ok !== true) {
    throw new CheckoutRequestError({
      error: typeof data.error === 'string' ? data.error : 'shipping_failed',
    })
  }
  if (data.served === false) return { served: false }
  if (typeof data.quoteId !== 'string' || !Array.isArray(data.options)) {
    throw new CheckoutRequestError({ error: 'shipping_failed' })
  }
  return {
    served: true,
    quoteId: data.quoteId,
    options: data.options,
    estimated: Boolean(data.estimated),
  }
}

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatusResult | null> {
  try {
    const params = new URLSearchParams({ session_id: sessionId })
    const response = await fetch(`/api/checkout/status?${params}`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as {
      status?: CheckoutStatus
      shippingService?: string | null
      pickupAddress?: string | null
    }
    if (!data.status) return null
    return {
      status: data.status,
      shippingService: data.shippingService ?? null,
      pickupAddress: data.pickupAddress ?? null,
    }
  } catch {
    return null
  }
}
