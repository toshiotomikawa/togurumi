import { createHash, randomBytes } from 'node:crypto'
import type express from 'express'

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

export function buildAllowedOrigins(appUrl: string) {
  return new Set([appUrl, 'http://localhost:5174', 'http://127.0.0.1:5174'])
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
