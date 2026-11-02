import type { CartItem } from '../context/cart'

export type CheckoutFailure = {
  error: string
  slug?: string
  available?: number
}

export type CheckoutStatus = 'paid' | 'pending' | 'failed' | 'expired' | 'open'

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
export async function startCheckout(items: CartItem[], locale: string): Promise<string> {
  let response: Response
  try {
    response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        locale,
        items: items.map((item) => ({ slug: item.slug, color: item.color ?? '', quantity: item.quantity })),
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

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatus | null> {
  try {
    const params = new URLSearchParams({ session_id: sessionId })
    const response = await fetch(`/api/checkout/status?${params}`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as { status?: CheckoutStatus }
    return data.status ?? null
  } catch {
    return null
  }
}
