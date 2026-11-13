const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:8788/api/auth/google/callback'

export function googleEnabled() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)
}

export function googleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

type GoogleProfile = {
  sub: string
  email: string
  emailVerified: boolean
}

export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) throw new Error('google_token_failed')

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  if (!tokenData.access_token) throw new Error('google_token_failed')

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profileRes.ok) throw new Error('google_profile_failed')

  const profile = (await profileRes.json()) as { sub?: string; email?: string; email_verified?: boolean }
  if (!profile.sub || !profile.email) throw new Error('google_profile_failed')

  return { sub: profile.sub, email: profile.email, emailVerified: profile.email_verified === true }
}

/** Only verified emails listed in GOOGLE_STAFF_EMAILS (comma-separated) may become staff. */
export function googleStaffAllowed(email: string, emailVerified: boolean): boolean {
  const allowed = (process.env.GOOGLE_STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return emailVerified && allowed.includes(email.trim().toLowerCase())
}
