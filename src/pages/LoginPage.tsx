import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="google-button__icon">
      <path
        fill="#8b817a"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5z"
      />
      <path
        fill="#a79b94"
        d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22z"
      />
      <path
        fill="#b8aaa3"
        d="M6.4 13.8a6 6 0 0 1 0-3.6V7.5H3a10 10 0 0 0 0 9z"
      />
      <path
        fill="#958982"
        d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.7C7.2 7.9 9.4 6.1 12 6.1z"
      />
    </svg>
  )
}

function LoginPage() {
  const { messages } = useLocale()
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    navigate(user.role === 'admin' ? '/admin' : '/admin/journal', { replace: true })
  }, [navigate, user])

  function getErrorMessage(code: string) {
    if (code === 'invalid_credentials') return messages.auth.invalidCredentials
    if (code === 'too_many_attempts') return messages.auth.tooManyAttempts
    return messages.auth.genericError
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const result = await login(username, password)
    if (!result.ok) {
      setError(getErrorMessage(result.error))
      setSubmitting(false)
      return
    }

    setSubmitting(false)
  }

  if (loading || user) {
    return (
      <div className="auth-route-loading" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="page page--narrow auth-page">
      <section className="card auth-card">
        <h1>{messages.auth.loginTitle}</h1>
        <p>{messages.auth.loginIntro}</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="form-field">
            <span>{messages.auth.username}</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <PasswordField
            label={messages.auth.password}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />

          <p className="auth-message" role="alert">
            {error}
          </p>

          <button type="submit" className="button button--primary auth-submit" disabled={submitting}>
            {messages.auth.submit}
          </button>
        </form>

        <div className="auth-divider">
          <span>{messages.auth.or}</span>
        </div>

        <button
          type="button"
          className="google-button"
          disabled
          aria-disabled="true"
          title={messages.auth.comingSoon}
        >
          <GoogleIcon />
          <span>{messages.auth.googleButton}</span>
          <span className="badge">{messages.auth.comingSoon}</span>
        </button>
      </section>
    </div>
  )
}

export default LoginPage
