import { useState, type FormEvent } from 'react'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

type Feedback = {
  kind: 'success' | 'error'
  text: string
}

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

  return 'generic'
}

function AccountPage() {
  const { messages } = useLocale()
  const { user, refresh, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [email, setEmail] = useState(user?.email ?? '')
  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  function getPasswordErrorMessage(code: string) {
    if (code === 'wrong_password') return messages.auth.wrongPassword
    if (code === 'weak_password') return messages.auth.weakPassword
    if (code === 'unauthorized') return messages.auth.genericError
    return messages.auth.genericError
  }

  function getProfileErrorMessage(code: string) {
    if (code === 'invalid_email') return messages.auth.invalidEmail
    return messages.auth.genericError
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordFeedback(null)

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ kind: 'error', text: messages.auth.passwordMismatch })
      return
    }

    setSavingPassword(true)

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        const code = await readErrorCode(response)
        setPasswordFeedback({ kind: 'error', text: getPasswordErrorMessage(code) })
        return
      }

      setPasswordFeedback({ kind: 'success', text: messages.auth.passwordUpdated })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordFeedback({ kind: 'error', text: messages.auth.genericError })
    } finally {
      setSavingPassword(false)
    }
  }

  async function onProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileFeedback(null)
    setSavingProfile(true)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        const code = await readErrorCode(response)
        setProfileFeedback({ kind: 'error', text: getProfileErrorMessage(code) })
        return
      }

      await refresh()
      setProfileFeedback({ kind: 'success', text: messages.auth.profileUpdated })
    } catch {
      setProfileFeedback({ kind: 'error', text: messages.auth.genericError })
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="page page--narrow account-page">
      <section className="card auth-card">
        <h1>{messages.auth.accountTitle}</h1>
        <p>{messages.auth.accountIntro}</p>

        <form className="auth-form" onSubmit={onPasswordSubmit}>
          <PasswordField
            label={messages.auth.currentPassword}
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />

          <PasswordField
            label={messages.auth.newPassword}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <PasswordField
            label={messages.auth.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {passwordFeedback ? (
            <p className={`editor-feedback editor-feedback--${passwordFeedback.kind}`} role="status">
              {passwordFeedback.text}
            </p>
          ) : null}

          <button type="submit" className="button button--primary auth-submit" disabled={savingPassword}>
            {messages.auth.changePassword}
          </button>
        </form>
      </section>

      <section className="card auth-card">
        <h2>{messages.auth.email}</h2>

        <form className="auth-form" onSubmit={onProfileSubmit}>
          <label className="form-field">
            <span>{messages.auth.emailOptional}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <small>{messages.auth.emailHint}</small>
          </label>

          {profileFeedback ? (
            <p className={`editor-feedback editor-feedback--${profileFeedback.kind}`} role="status">
              {profileFeedback.text}
            </p>
          ) : null}

          <button type="submit" className="button button--primary auth-submit" disabled={savingProfile}>
            {messages.auth.saveProfile}
          </button>
        </form>
      </section>
    </div>
  )
}

export default AccountPage
