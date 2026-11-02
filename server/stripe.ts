import Stripe from 'stripe'
import { lineItemsToOrderItems } from './stripeWebhook.js'
import type { OrderItem } from './orders.js'

let client: Stripe | null = null
let clientKey = ''

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function stripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
}

/** Public address used for the Checkout success/cancel redirects. */
export function publicSiteUrl() {
  const value = process.env.PUBLIC_SITE_URL?.trim() || process.env.APP_URL?.trim() || 'http://localhost:5174'
  return value.replace(/\/+$/, '')
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  if (!client || clientKey !== key) {
    client = new Stripe(key, { appInfo: { name: 'togurumi-shop' } })
    clientKey = key
  }
  return client
}

export async function listCheckoutOrderItems(sessionId: string): Promise<OrderItem[]> {
  const lineItems = await getStripe().checkout.sessions
    .listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] })
    .autoPagingToArray({ limit: 1000 })
  return lineItemsToOrderItems(lineItems)
}
