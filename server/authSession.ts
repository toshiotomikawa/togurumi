import { createHash, randomBytes } from 'node:crypto'
import type express from 'express'

type OriginEnvironment = Record<string, string | undefined>

export function clientFingerprint(req: express.Request): string {
  return createHash('sha256').update(String(req.headers['user-agent'] ?? '')).digest('hex')
}

export function regenerateSession(req: express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function establishAuthSession(req: express.Request, userId: string) {
  await regenerateSession(req)
  req.session.userId = userId
  req.session.clientFp = clientFingerprint(req)
}

export function createOAuthState(): string {
  return randomBytes(24).toString('hex')
}

function addVercelOrigin(origins: Set<string>, hostname: string | undefined) {
  const value = hostname?.trim()
  if (!value) return

  try {
    const url = new URL(`https://${value}`)
    if (url.host !== value || url.pathname !== '/' || url.search || url.hash) return
    origins.add(url.origin)
  } catch {
    // Ignore malformed system environment values rather than widening the allowlist.
  }
}

export function buildAllowedOrigins(appUrl: string, environment: OriginEnvironment = process.env) {
  const origins = new Set([appUrl, 'http://localhost:5174', 'http://127.0.0.1:5174'])
  for (const lanOrigin of (environment.LAN_APP_URL ?? '').split(',')) {
    const trimmed = lanOrigin.trim()
    if (trimmed) origins.add(trimmed)
  }

  if (environment.VERCEL === '1') {
    addVercelOrigin(origins, environment.VERCEL_URL)
    addVercelOrigin(origins, environment.VERCEL_BRANCH_URL)
    if (environment.VERCEL_ENV === 'production') {
      addVercelOrigin(origins, environment.VERCEL_PROJECT_PRODUCTION_URL)
    }
  }

  return origins
}

export function originAllowed(req: express.Request, allowedOrigins: Set<string>) {
  const origin = req.headers.origin
  if (origin) return allowedOrigins.has(origin)

  const referer = req.headers.referer
  if (!referer) return false

  try {
    return allowedOrigins.has(new URL(referer).origin)
  } catch {
    return false
  }
}
