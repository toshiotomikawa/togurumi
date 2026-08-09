import 'dotenv/config'
import cookieParser from 'cookie-parser'
import express from 'express'
import session from 'express-session'
import bcrypt from 'bcrypt'
import {
  buildAllowedOrigins,
  clientFingerprint,
  createOAuthState,
  establishAuthSession,
  originAllowed,
} from './authSession'
import { SESSION_COOKIE, clearCookieOptions, sessionCookieOptions } from './cookies'
import { fetchGoogleProfile, googleAuthUrl, googleEnabled } from './google'
import { deleteImageKitFile, ImageKitError, imageKitEnabled, uploadProductImage } from './imageKit'
import {
  JournalError,
  isJournalLocale,
  type JournalLocale,
  type JournalPostInput,
} from './journal'
import { FaqError } from './faq'
import { ReviewError } from './reviews'
import { SiteContentError } from './siteContent'
import { createRuntimeSessionStore } from './persistence/sessionStore'
import { createRuntimeRateLimitStore } from './persistence/rateLimitStore'
import { createRuntimeReviewStore } from './persistence/reviewStore'
import { createRuntimeContentStores } from './persistence/contentStores'
import { createRuntimeJournalStore } from './persistence/journalStore'
import { SheetsError, appendSheetRow, getSheetTab, updateSheetRange } from './sheets'
import { getProductImageTargets, getShopProducts, setProductImage } from './shop'
import { createRuntimeUserStore } from './persistence/userStore'
import type { UserRecord } from './store'

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

app.get('/api/journal/:id', requireAuth, async (req, res) => {
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

app.put('/api/journal/:id', requireAuth, async (req, res) => {
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

app.delete('/api/journal/:id', requireAuth, async (req, res) => {
  const ok = await journalStore.delete(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ ok: true })
})

app.patch('/api/journal/:id/archive', requireAuth, async (req, res) => {
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

app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
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

app.put('/api/faq/:locale', requireAuth, async (req, res) => {
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

app.put('/api/content/:locale/:section', requireAuth, async (req, res) => {
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

app.put('/api/sheets/:tab/:range', requireAuth, async (req, res) => {
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

app.post('/api/sheets/:tab/append', requireAuth, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Auth API http://localhost:${PORT}`)
})
