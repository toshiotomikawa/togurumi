import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue, type LoginResult, type PublicUser } from '../context/auth'

function getErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const error = (payload as { error?: unknown }).error
  return typeof error === 'string' ? error : null
}

async function readErrorCode(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown
    const code = getErrorCode(payload)
    if (code) return code
  } catch {
    // Fall through to status-based codes.
  }

  if (response.status === 401) return 'invalid_credentials'
  if (response.status === 429) return 'too_many_attempts'
  return 'generic'
}

async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    if (!response.ok) return null
    const payload = (await response.json()) as { user: PublicUser | null }
    return payload.user
  } catch {
    return null
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      const nextUser = await fetchCurrentUser()
      if (cancelled) return
      setUser(nextUser)
      setLoading(false)
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    const nextUser = await fetchCurrentUser()
    setUser(nextUser)
    return nextUser
  }, [])

  const login = useCallback<AuthContextValue['login']>(
    async (username, password): Promise<LoginResult> => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          return { ok: false, error: await readErrorCode(response) }
        }

        const payload = (await response.json()) as { user: PublicUser | null }
        if (!payload.user) return { ok: false, error: 'generic' }
        setUser(payload.user)
        return { ok: true }
      } catch {
        return { ok: false, error: 'network' }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // The local auth state should still be cleared if the request cannot complete.
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
