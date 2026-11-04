import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import cookieParser from 'cookie-parser'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcrypt'
import type Stripe from 'stripe'
import {
  buildAllowedOrigins,
  clientFingerprint,
  createOAuthState,
  establishAuthSession,
  originAllowed,
} from './authSession.js'
import { SESSION_COOKIE, clearCookieOptions, sessionCookieOptions } from './cookies.js'
import { fetchGoogleProfile, googleAuthUrl, googleEnabled } from './google.js'
import { deleteImageKitFile, ImageKitError, imageKitEnabled, uploadProductImage } from './imageKit.js'
import {
  JournalError,
  isJournalLocale,
  type JournalLocale,
  type JournalPostInput,
} from './journal.js'
import { FaqError } from './faq.js'
import { ReviewError } from './reviews.js'
import { SiteContentError } from './siteContent.js'
import { createRuntimeSessionStore } from './persistence/sessionStore.js'
import { createRuntimeRateLimitStore } from './persistence/rateLimitStore.js'
import { createRuntimeReviewStore } from './persistence/reviewStore.js'
import { createRuntimeContentStores } from './persistence/contentStores.js'
import { createRuntimeJournalStore } from './persistence/journalStore.js'
import { SheetsError, appendSheetRow, getSheetTab, updateSheetRange } from './sheets.js'
import { decrementProductStock, getProductImageTargets, getShopProducts, getShopShipping, readShopStock, setProductImage } from './shop.js'
import {
  CHECKOUT_SESSION_TTL_SECONDS,
  CHECKOUT_SOURCE,
  CheckoutError,
  RESERVATION_TTL_SECONDS,
  buildCheckoutLines,
  buildCheckoutSessionParams,
  parseCartRequest,
} from './checkout.js'
import { createRuntimeOrderStore } from './persistence/orderStore.js'
import { createRuntimeRefundStore } from './persistence/refundStore.js'
import { MAX_REFUND_EMAIL, RefundError, parseRefundRequest, refundEmailMatches } from './refunds.js'
import type { RefundRequestInput } from './refunds.js'
import type { OrderRecord } from './orders.js'
import { refundNotificationConfig, sendRefundNotification } from './refundNotify.js'
import { ShippingError, quoteShipping, shippingConfig, verifyQuoteToken } from './shipping.js'
import { getStripe, listCheckoutOrderItems, publicSiteUrl, stripeEnabled, stripeWebhookSecret } from './stripe.js'
import { handleStripeWebhook } from './stripeWebhook.js'
import { createRuntimeUserStore } from './persistence/userStore.js'
import type { UserRecord } from './store.js'
import { validateRuntimeEnvironment } from './runtimeConfig.js'

validateRuntimeEnvironment(process.env)

const PORT = Number(process.env.API_PORT ?? 8788)
const APP_URL = process.env.APP_URL ?? 'http://localhost:5174'
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-only-change-me'
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const ALLOWED_ORIGINS = buildAllowedOrigins(APP_URL)
const sessionStore = createRuntimeSessionStore(SESSION_SECRET, SESSION_MAX_AGE_MS)
const rateLimitStore = createRuntimeRateLimitStore(SESSION_SECRET)
const reviewStore = createRuntimeReviewStore()
const { siteContentStore, faqStore } = createRuntimeContentStores()
const journalStore = createRuntimeJournalStore()
const userStore = createRuntimeUserStore()
const orderStore = createRuntimeOrderStore()
const refundStore = createRuntimeRefundStore()

if (process.env.NODE_ENV === 'production' && SESSION_SECRET === 'dev-only-change-me') {
  throw new Error('Set SESSION_SECRET in production')
}

declare module 'express-session' {
  interface SessionData {
    userId?: string
    clientFp?: string
    oauthState?: string
  }
}

const app = express()
app.set('trust proxy', 1)

// Registered before the JSON parser, sessions and the Origin check: Stripe
// signs the exact raw body and its requests carry no browser Origin header.
app.post('/api/stripe/webhook', express.raw({ type: () => true, limit: '1mb' }), async (req, res) => {
  const webhookSecret = stripeWebhookSecret()
  if (!stripeEnabled() || !webhookSecret) {
    res.status(503).json({ error: 'stripe_disabled' })
    return
  }

  const result = await handleStripeWebhook(
    {
      webhookSecret,
      constructEvent: (payload, signature, secret) => getStripe().webhooks.constructEvent(payload, signature, secret),
      listLineItems: listCheckoutOrderItems,
      orderStore,
      applyStock: (slug, quantity) => decrementProductStock(slug, quantity),
      logger: console,
    },
    req.body,
    req.headers['stripe-signature'],
  )
  res.status(result.status).json(result.body)
})

app.use(cookieParser())
app.use(express.json())
app.use(
  session({
    name: SESSION_COOKIE,
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: true,
    cookie: (req) => sessionCookieOptions(req, SESSION_MAX_AGE_MS),
  }),
)

const SESSION_RESET_PATHS = new Set(['/api/auth/login', '/api/auth/logout'])

app.use((req, res, next) => {
  if (!req.session.userId || SESSION_RESET_PATHS.has(req.path)) {
    next()
    return
  }

  const fp = clientFingerprint(req)
  if (!req.session.clientFp) {
    req.session.clientFp = fp
  } else if (req.session.clientFp !== fp) {
    req.session.destroy(() => {
      res.clearCookie(SESSION_COOKIE, clearCookieOptions(req))
      res.status(401).json({ error: 'session_invalid' })
    })
    return
  }

  next()
})

function requireAllowedOrigin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  if (!originAllowed(req, ALLOWED_ORIGINS)) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  next()
}

app.use('/api', requireAllowedOrigin)

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}

async function requireStaff(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const user = await userStore.findByUsername(req.session.userId)
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    res.status(403).json({ error: 'forbidden' })
    return
  }

  next()
}

function toPublicUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  }
}

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    res.json({ user: null })
    return
  }

  const user = await userStore.findByUsername(req.session.userId)
  if (!user) {
    req.session.destroy(() => undefined)
    res.json({ user: null })
    return
  }

  res.json({ user: toPublicUser(user) })
})

app.get('/api/auth/config', (_req, res) => {
  res.json({ google: googleEnabled() })
})

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  const key = `${req.ip}:${username}`

  if (await rateLimitStore.isLoginBlocked(key)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  const user = await userStore.findByUsername(username)

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    await rateLimitStore.registerLoginFailure(key, 5, 15 * 60 * 1000)
    res.status(401).json({ error: 'invalid_credentials' })
    return
  }

  await establishAuthSession(req, user.username)
  res.json({ user: toPublicUser(user) })
})

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

app.post('/api/auth/password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword ?? '')
  const newPassword = String(req.body?.newPassword ?? '')
  const user = await userStore.findByUsername(req.session.userId ?? '')

  if (!user) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: 'wrong_password' })
    return
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'weak_password' })
    return
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  await userStore.save(user)
  res.json({ ok: true })
})

app.post('/api/auth/profile', requireAuth, async (req, res) => {
  const user = await userStore.findByUsername(req.session.userId ?? '')

  if (!user) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  if (req.body?.email !== undefined) {
    const email = String(req.body.email).trim()
    if (email && !isValidEmail(email)) {
      res.status(400).json({ error: 'invalid_email' })
      return
    }
    user.email = email || null
  }

  if (req.body?.displayName !== undefined) {
    const displayName = String(req.body.displayName).trim()
    if (!displayName) {
      res.status(400).json({ error: 'invalid_display_name' })
      return
    }
    user.displayName = displayName
  }

  await userStore.save(user)
  res.json({ user: toPublicUser(user) })
})

app.post('/api/auth/logout', (req, res) => {
  const clear = clearCookieOptions(req)
  req.session.destroy(() => {
    res.clearCookie(SESSION_COOKIE, clear)
    res.json({ ok: true })
  })
})

app.get('/api/auth/google', (req, res) => {
  if (!googleEnabled()) {
    res.status(503).json({ error: 'google_unavailable' })
    return
  }
  const state = createOAuthState()
  req.session.oauthState = state
  res.redirect(googleAuthUrl(state))
})

app.get('/api/auth/google/callback', async (req, res) => {
  if (!googleEnabled()) {
    res.redirect(`${APP_URL}/login?error=google_unavailable`)
    return
  }

  const code = String(req.query.code ?? '')
  const state = String(req.query.state ?? '')
  const expectedState = req.session.oauthState
  delete req.session.oauthState

  if (!code || !expectedState || state !== expectedState) {
    res.redirect(`${APP_URL}/login?error=google_failed`)
    return
  }

  try {
    const profile = await fetchGoogleProfile(code)
    let user = await userStore.findByGoogleId(profile.sub)
    if (!user) {
      user = await userStore.createWithGoogle(profile.sub, profile.email, 'moderator')
    }

    await establishAuthSession(req, user.username)
    res.redirect(`${APP_URL}/admin?login=1`)
  } catch {
    res.redirect(`${APP_URL}/login?error=google_failed`)
  }
})

function parseJournalInput(body: unknown): JournalPostInput {
  const data = body as Record<string, unknown>
  return {
    slug: String(data?.slug ?? '').trim(),
    locale: String(data?.locale ?? 'en-US') as JournalLocale,
    title: String(data?.title ?? '').trim(),
    date: String(data?.date ?? '').trim(),
    order: Number(data?.order ?? 0),
    summary: String(data?.summary ?? '').trim(),
    body: String(data?.body ?? ''),
    archived: Boolean(data?.archived),
  }
}

app.get('/api/public/journal', async (req, res) => {
  const locale = String(req.query.locale ?? '')
  if (!isJournalLocale(locale)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  const author = String(req.query.author ?? '').trim() || undefined
  const includeArchived = req.query.includeArchived === '1' && Boolean(req.session.userId)
  const posts = await journalStore.listPublic(locale, author, includeArchived)
  res.json({ posts })
})

app.get('/api/public/journal/:slug', async (req, res) => {
  const locale = String(req.query.locale ?? '')
  if (!isJournalLocale(locale)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  const includeArchived = req.query.includeArchived === '1' && Boolean(req.session.userId)
  const post = await journalStore.getPublic(req.params.slug, locale, includeArchived)
  if (!post) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ post })
})

app.get('/api/journal', requireAuth, async (_req, res) => {
  const posts = await journalStore.list()
  res.json({ posts })
})

app.get<{ id: string }>('/api/journal/:id', requireAuth, async (req, res) => {
  const post = await journalStore.get(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ post })
})

app.post('/api/journal', requireAuth, async (req, res) => {
  try {
    const post = await journalStore.create(parseJournalInput(req.body))
    res.status(201).json({ post })
  } catch (err) {
    if (err instanceof JournalError) {
      res.status(err.code === 'slug_exists' ? 409 : 400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.put<{ id: string }>('/api/journal/:id', requireAuth, async (req, res) => {
  try {
    const post = await journalStore.update(req.params.id, parseJournalInput(req.body))
    res.json({ post })
  } catch (err) {
    if (err instanceof JournalError) {
      const status = err.code === 'not_found' ? 404 : err.code === 'slug_exists' ? 409 : 400
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

app.delete<{ id: string }>('/api/journal/:id', requireAuth, async (req, res) => {
  const ok = await journalStore.delete(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ ok: true })
})

app.patch<{ id: string }>('/api/journal/:id/archive', requireAuth, async (req, res) => {
  try {
    const archived = Boolean((req.body as Record<string, unknown> | null)?.archived)
    const post = await journalStore.setArchived(req.params.id, archived)
    res.json({ post })
  } catch (err) {
    if (err instanceof JournalError) {
      res.status(err.code === 'not_found' ? 404 : 400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.get('/api/shop/products', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store')
    const products = await getShopProducts()
    res.json({ products })
  } catch (err) {
    if (err instanceof SheetsError) {
      const status = err.code === 'disabled' ? 503 : err.code === 'invalid_tab' ? 400 : 502
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

app.get('/api/shipping/status', (_req, res) => {
  const config = shippingConfig(process.env)
  res.setHeader('Cache-Control', 'no-store')
  res.json({ enabled: Boolean(config), pickup: Boolean(config?.pickupAddress) })
})

app.post('/api/shipping/quote', async (req, res) => {
  const config = shippingConfig(process.env)
  if (!config) {
    res.status(503).json({ error: 'shipping_disabled' })
    return
  }
  if (!await rateLimitStore.consume(`shipping:${req.ip ?? 'unknown'}`, 20, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  try {
    const items = parseCartRequest(req.body)
    const lines = buildCheckoutLines(items, await getShopProducts({ forceRefresh: true }))
    const result = await quoteShipping({
      cep: req.body?.cep,
      items,
      lines,
      shipping: await getShopShipping(),
      config,
      secret: SESSION_SECRET,
    })
    if (!result.served) {
      res.json({ ok: true, served: false })
      return
    }
    res.json({
      ok: true,
      served: true,
      quoteId: result.quoteId,
      options: result.options,
      estimated: result.estimated,
    })
  } catch (err) {
    if (err instanceof CheckoutError) {
      res.status(err.code === 'invalid_cart' ? 400 : 409).json({ error: err.code, ...err.details })
      return
    }
    if (err instanceof ShippingError) {
      res.status(err.code === 'invalid_cep' ? 400 : 502).json({ error: err.code })
      return
    }
    if (err instanceof SheetsError) {
      res.status(err.code === 'disabled' ? 503 : 502).json({ error: err.code })
      return
    }
    // Log the code only: fetch errors can echo request headers, and the token must never reach the logs.
    console.error('[shipping] quote failed', err instanceof ShippingError ? err.code : err instanceof Error ? err.name : 'unknown')
    res.status(502).json({ error: 'quote_unavailable' })
  }
})

app.post('/api/checkout', async (req, res) => {
  if (!stripeEnabled()) {
    res.status(503).json({ error: 'checkout_unavailable' })
    return
  }

  if (!await rateLimitStore.consume(`checkout:${req.ip ?? 'unknown'}`, 10, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  try {
    const items = parseCartRequest(req.body)
    const config = shippingConfig(process.env)
    let shipping
    let shippingQuoteId: string | undefined
    let shippingCep: string | undefined
    if (config) {
      const selection = req.body?.shipping as { quoteId?: unknown; optionId?: unknown } | undefined
      const quoteId = typeof selection?.quoteId === 'string' ? selection.quoteId : ''
      const optionId = typeof selection?.optionId === 'string' ? selection.optionId : ''
      if (!quoteId || !optionId) throw new ShippingError('shipping_required')
      const quote = verifyQuoteToken(quoteId, SESSION_SECRET, items)
      const option = quote?.options.find((entry) => entry.id === optionId)
      if (!quote || !option) throw new ShippingError('shipping_quote_invalid')
      shipping = option
      shippingQuoteId = quote.id
      shippingCep = quote.cep
    }
    const lines = buildCheckoutLines(items, await getShopProducts({ forceRefresh: true }))

    // Hold the units before sending the customer to Stripe; other checkouts
    // see only what is left. The webhook releases the hold on expiry or failure.
    const reservationId = randomUUID()
    const now = Date.now()
    const reservation = await orderStore.reserveStock(
      reservationId,
      lines,
      await readShopStock(),
      now + RESERVATION_TTL_SECONDS * 1000,
    )
    if (reservation.ok === false) {
      throw new CheckoutError(reservation.available === 0 ? 'product_unavailable' : 'insufficient_stock', {
        slug: reservation.slug,
        available: reservation.available,
      })
    }

    let session: Stripe.Checkout.Session
    try {
      session = await getStripe().checkout.sessions.create(
        buildCheckoutSessionParams(lines, {
          siteUrl: publicSiteUrl(),
          locale: req.body?.locale,
          reservationId,
          expiresAt: Math.floor(now / 1000) + CHECKOUT_SESSION_TTL_SECONDS,
          shipping,
          shippingQuoteId,
          shippingCep,
        }),
        { idempotencyKey: reservationId },
      )
      if (!session.url) throw new Error('Stripe returned a Checkout Session without a URL')
    } catch (err) {
      await orderStore.releaseReservation(reservationId).catch(() => undefined)
      throw err
    }
    res.json({ url: session.url })
  } catch (err) {
    if (err instanceof CheckoutError) {
      res.status(err.code === 'invalid_cart' ? 400 : 409).json({ error: err.code, ...err.details })
      return
    }
    if (err instanceof ShippingError) {
      const status = err.code === 'shipping_required'
        ? 400
        : err.code === 'shipping_quote_invalid'
          ? 409
          : 503
      res.status(status).json({ error: err.code })
      return
    }
    if (err instanceof SheetsError) {
      res.status(503).json({ error: 'checkout_unavailable' })
      return
    }
    console.error('[checkout] failed to create Checkout Session', err)
    res.status(502).json({ error: 'checkout_failed' })
  }
})

app.get('/api/checkout/status', async (req, res) => {
  if (!await rateLimitStore.consume(`checkout-status:${req.ip ?? 'unknown'}`, 60, 60_000)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }
  const sessionId = String(req.query.session_id ?? '')
  if (!stripeEnabled() || !/^cs_(test|live)_[A-Za-z0-9]{1,200}$/.test(sessionId)) {
    res.status(400).json({ error: 'invalid_session' })
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.metadata?.source !== CHECKOUT_SOURCE) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    // Only the payment state is exposed; customer details stay server-side.
    // A failed Pix keeps payment_status "unpaid", so the webhook record decides.
    const order = await orderStore.getOrder(session.id).catch(() => null)
    const status = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
      ? 'paid'
      : order?.status === 'failed'
        ? 'failed'
        : session.status === 'expired'
          ? 'expired'
          : session.status === 'complete'
            ? 'pending'
            : 'open'
    const shippingService = order?.shippingService ?? session.metadata?.shipping_service ?? null
    const config = shippingConfig(process.env)
    const pickupAddress = shippingService === 'pickup' && config?.pickupAddress
      ? config.pickupAddress
      : null
    res.json({ status, shippingService, pickupAddress })
  } catch {
    res.status(404).json({ error: 'not_found' })
  }
})

/**
 * Manual refund request. The response never says whether the order exists:
 * a wrong e-mail, an unpaid order and a paid order get the same answer.
 */
app.post('/api/refunds', async (req, res) => {
  if (!await rateLimitStore.consume(`refund:${req.ip ?? 'unknown'}`, 10, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  let input: RefundRequestInput
  try {
    input = parseRefundRequest(req.body)
  } catch (err) {
    if (err instanceof RefundError) {
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  if (!email || email.length > MAX_REFUND_EMAIL || !isValidEmail(email)) {
    res.status(400).json({ error: 'invalid_request' })
    return
  }

  try {
    const order = await orderStore.getOrder(input.sessionId)
    if (!refundEmailMatches(order, email)) {
      res.json({ received: true })
      return
    }

    const request = await refundStore.add(input)
    if (request) {
      const config = refundNotificationConfig()
      if (config) {
        try {
          await sendRefundNotification(config, request, order, `${publicSiteUrl()}/admin/refunds`)
        } catch (err) {
          // The request is already stored; a missing e-mail must not fail the customer.
          console.error('[refund] notification failed', err)
        }
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[refund] failed to record request', err)
    res.status(500).json({ error: 'refund_failed' })
  }
})

function refundOrderSummary(order: OrderRecord | null) {
  if (!order) return null
  return {
    status: order.status,
    amountTotal: order.amountTotal,
    currency: order.currency,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    items: order.items,
    createdAt: order.createdAt,
  }
}

app.get('/api/admin/refund-requests', requireStaff, async (_req, res) => {
  const requests = await refundStore.list()
  const withOrders = await Promise.all(requests.map(async (request) => ({
    ...request,
    order: refundOrderSummary(await orderStore.getOrder(request.sessionId).catch(() => null)),
  })))
  res.json({ requests: withOrders })
})

app.patch<{ id: string }>('/api/admin/refund-requests/:id', requireStaff, async (req, res) => {
  const status = req.body?.status
  if (status !== 'approved' && status !== 'declined') {
    res.status(400).json({ error: 'invalid_status' })
    return
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
    res.status(404).json({ error: 'not_found' })
    return
  }

  const request = await refundStore.setStatus(req.params.id, status)
  if (!request) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ request })
})

app.get('/api/shop/product-images', requireStaff, async (_req, res) => {
  if (!imageKitEnabled()) {
    res.status(503).json({ error: 'imagekit_disabled' })
    return
  }

  try {
    const products = await getProductImageTargets()
    res.json({ products })
  } catch (err) {
    if (err instanceof SheetsError) {
      const status = err.code === 'disabled' ? 503 : err.code === 'invalid_tab' ? 400 : 502
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

app.put(
  '/api/shop/product-images/:rowNumber',
  requireStaff,
  express.raw({ type: () => true, limit: '8mb' }),
  async (req, res) => {
    const userId = req.session.userId ?? ''
    if (!await rateLimitStore.consume(`upload:${userId}`, 20, 15 * 60 * 1000)) {
      res.status(429).json({ error: 'too_many_attempts' })
      return
    }

    const rowNumber = Number(req.params.rowNumber)
    const productName = String(req.query.name ?? '').trim()
    const color = String(req.query.color ?? '').trim()
    if (
      !Number.isInteger(rowNumber) ||
      rowNumber < 2 ||
      !productName ||
      productName.length > 500 ||
      color.length > 200 ||
      !Buffer.isBuffer(req.body)
    ) {
      res.status(400).json({ error: 'invalid_image' })
      return
    }

    let uploaded: Awaited<ReturnType<typeof uploadProductImage>> | null = null
    try {
      uploaded = await uploadProductImage(req.body)
      const images = await setProductImage(rowNumber, productName, color, uploaded.url)
      res.json({
        url: uploaded.url,
        defaultImage: images.default,
        imagesByColor: images.colors,
      })
    } catch (err) {
      if (err instanceof SheetsError) {
        if (uploaded) await deleteImageKitFile(uploaded.fileId)
        const status = err.code === 'row_changed' ? 409 : err.code === 'disabled' ? 503 : 502
        res.status(status).json({ error: err.code })
        return
      }
      if (err instanceof ImageKitError) {
        const status = err.code === 'invalid_image' ? 400 : err.code === 'disabled' ? 503 : 502
        res.status(status).json({ error: err.code })
        return
      }
      throw err
    }
  },
)

app.get('/api/reviews', async (_req, res) => {
  const reviews = await reviewStore.list()
  res.json({ reviews })
})

app.post('/api/reviews', async (req, res) => {
  const key = `review:${req.ip ?? 'unknown'}`
  if (!await rateLimitStore.consume(key, 1, 60_000)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  try {
    const review = await reviewStore.add({
      name: String(req.body?.name ?? ''),
      rating: Number(req.body?.rating ?? 0),
      comment: String(req.body?.comment ?? ''),
    })
    res.status(201).json({ review })
  } catch (err) {
    if (err instanceof ReviewError) {
      await rateLimitStore.reset(key)
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.delete<{ id: string }>('/api/reviews/:id', requireAuth, async (req, res) => {
  const ok = await reviewStore.delete(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ ok: true })
})

app.get('/api/faq/:locale', async (req, res) => {
  try {
    const faq = await faqStore.get(req.params.locale)
    res.json({ faq })
  } catch (err) {
    if (err instanceof FaqError) {
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.put<{ locale: string }>('/api/faq/:locale', requireAuth, async (req, res) => {
  try {
    const faq = await faqStore.update(req.params.locale, req.body)
    res.json({ faq })
  } catch (err) {
    if (err instanceof FaqError) {
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.get('/api/content/:locale/:section', async (req, res) => {
  try {
    const content = await siteContentStore.get(req.params.locale, req.params.section)
    res.json({ content })
  } catch (err) {
    if (err instanceof SiteContentError) {
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.put<{ locale: string; section: string }>('/api/content/:locale/:section', requireAuth, async (req, res) => {
  try {
    const content = await siteContentStore.update(req.params.locale, req.params.section, req.body)
    res.json({ content })
  } catch (err) {
    if (err instanceof SiteContentError) {
      res.status(400).json({ error: err.code })
      return
    }
    throw err
  }
})

app.get('/api/sheets/:tab', async (req, res) => {
  try {
    const rows = await getSheetTab(req.params.tab)
    res.json({ rows })
  } catch (err) {
    if (err instanceof SheetsError) {
      const status = err.code === 'disabled' ? 503 : err.code === 'invalid_tab' ? 400 : 502
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

app.put<{ tab: string; range: string }>('/api/sheets/:tab/:range', requireAuth, async (req, res) => {
  const values = req.body?.values
  if (!Array.isArray(values) || !values.every((row) => Array.isArray(row))) {
    res.status(400).json({ error: 'invalid_values' })
    return
  }

  try {
    await updateSheetRange(req.params.tab, req.params.range, values)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof SheetsError) {
      const status = err.code === 'disabled' ? 503 : err.code === 'invalid_tab' ? 400 : 502
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

app.post<{ tab: string }>('/api/sheets/:tab/append', requireAuth, async (req, res) => {
  const row = req.body?.row
  if (!Array.isArray(row)) {
    res.status(400).json({ error: 'invalid_row' })
    return
  }

  try {
    await appendSheetRow(req.params.tab, row)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof SheetsError) {
      const status = err.code === 'disabled' ? 503 : err.code === 'invalid_tab' ? 400 : 502
      res.status(status).json({ error: err.code })
      return
    }
    throw err
  }
})

export function startLocalServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`Auth API http://localhost:${port}`)
  })
}

const entrypoint = process.argv[1]
if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) {
  startLocalServer()
}

export default app
