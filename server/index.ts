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
import {
  JournalError,
  createPost,
  deletePost,
  getPost,
  listAllPosts,
  updatePost,
  type JournalLocale,
  type JournalPostInput,
} from './journal'
import { FileSessionStore } from './sessionStore'
import { ensureSeedUser, findUser, createGoogleUser, findUserByGoogleId, saveUser, type UserRecord } from './store'

const PORT = Number(process.env.API_PORT ?? 8788)
const APP_URL = process.env.APP_URL ?? 'http://localhost:5174'
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-only-change-me'
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const ALLOWED_ORIGINS = buildAllowedOrigins(APP_URL)
const sessionStore = new FileSessionStore(SESSION_SECRET)

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

const loginAttempts = new Map<string, { count: number; until: number }>()

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

function rateLimit(key: string) {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (entry && entry.until > now) return false
  if (entry && entry.until <= now) loginAttempts.delete(key)
  return true
}

function registerFailure(key: string) {
  const entry = loginAttempts.get(key) ?? { count: 0, until: 0 }
  entry.count += 1
  if (entry.count >= 5) {
    entry.until = Date.now() + 15 * 60 * 1000
    entry.count = 0
  }
  loginAttempts.set(key, entry)
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

  const user = await findUser(req.session.userId)
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

  if (!rateLimit(key)) {
    res.status(429).json({ error: 'too_many_attempts' })
    return
  }

  const user = await findUser(username)

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    registerFailure(key)
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
  const user = await findUser(req.session.userId ?? '')

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
  await saveUser(user)
  res.json({ ok: true })
})

app.post('/api/auth/profile', requireAuth, async (req, res) => {
  const user = await findUser(req.session.userId ?? '')

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

  await saveUser(user)
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
    let user = await findUserByGoogleId(profile.sub)
    if (!user) {
      user = await createGoogleUser(profile.sub, profile.email, 'moderator')
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
  }
}

app.get('/api/journal', requireAuth, async (_req, res) => {
  const posts = await listAllPosts()
  res.json({ posts })
})

app.get('/api/journal/:id', requireAuth, async (req, res) => {
  const post = await getPost(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ post })
})

app.post('/api/journal', requireAuth, async (req, res) => {
  try {
    const post = await createPost(parseJournalInput(req.body))
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
    const post = await updatePost(req.params.id, parseJournalInput(req.body))
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
  const ok = await deletePost(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json({ ok: true })
})

await ensureSeedUser(process.env.ADMIN_USERNAME ?? 'admin', process.env.ADMIN_PASSWORD ?? 'change-me', 'admin')
await ensureSeedUser(
  process.env.MODERATOR_USERNAME ?? 'moderator',
  process.env.MODERATOR_PASSWORD ?? 'change-me',
  'moderator',
)

app.listen(PORT, () => {
  console.log(`Auth API http://localhost:${PORT}`)
})
