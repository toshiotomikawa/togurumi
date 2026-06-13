import { createContext } from 'react'

export type UserRole = 'admin' | 'moderator'

export type PublicUser = {
  id: string
  username: string
  displayName: string
  email: string | null
  role: UserRole
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export type AuthContextValue = {
  user: PublicUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refresh: () => Promise<PublicUser | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
