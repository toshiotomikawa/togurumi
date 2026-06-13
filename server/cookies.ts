import type express from 'express'

export const SESSION_COOKIE = 'togurumi.sid'

export function isSecureRequest(req: express.Request): boolean {
  if (req.secure) return true
  const forwarded = req.headers['x-forwarded-proto']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() === 'https'
  }
  return false
}

export function baseCookieOptions(req: express.Request) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: isSecureRequest(req),
    path: '/',
  }
}

export function sessionCookieOptions(req: express.Request, maxAge: number) {
  return {
    ...baseCookieOptions(req),
    maxAge,
  }
}

export function clearCookieOptions(req: express.Request) {
  return baseCookieOptions(req)
}
