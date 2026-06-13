import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'
import { localePreferences, type LocalePreference } from '../lib/i18n'
import { themeModes, type ThemeMode } from '../lib/theme'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M5.5 20a6.5 6.5 0 0 1 13 0"
      />
    </svg>
  )
}

function LocaleIcon({ preference }: { preference: LocalePreference }) {
  if (preference === 'en-US') return <span className="settings-toggle__glyph">EN</span>
  if (preference === 'pt-BR') return <span className="settings-toggle__glyph">PT</span>
  if (preference === 'es-ES') return <span className="settings-toggle__glyph">ES</span>

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M3.5 12h17M12 3.5c2.8 2.9 4.2 6.1 4.2 8.5S14.8 17.1 12 20M12 3.5C9.2 6.4 7.8 9.6 7.8 12s1.4 5.6 4.2 8.5"
      />
    </svg>
  )
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'day') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"
        />
      </svg>
    )
  }

  if (mode === 'night') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.5 4.2a7.5 7.5 0 1 0 4.3 12.1A6.2 6.2 0 0 1 15.5 4.2z"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M9 18.5h6" />
      <path
        fill="currentColor"
        d="M12 8.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zm-3.8 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zm7.6 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z"
        opacity="0.85"
      />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`auth-menu__chevron${open ? ' is-open' : ''}`}>
      <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { messages, preference, setPreference } = useLocale()
  const { theme, setTheme } = useTheme()
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [localeExpanded, setLocaleExpanded] = useState(false)
  const [themeExpanded, setThemeExpanded] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setLocaleExpanded(false)
      setThemeExpanded(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function onLogout() {
    await logout()
    setOpen(false)
    onNavigate?.()
  }

  function close() {
    setOpen(false)
    onNavigate?.()
  }

  if (loading) return null

  const localeLabelFor = (id: LocalePreference) => {
    if (id === 'system') return messages.locale.system
    if (id === 'en-US') return messages.locale.enUS
    if (id === 'pt-BR') return messages.locale.ptBR
    return messages.locale.esES
  }

  const themeLabels: Record<ThemeMode, string> = {
    system: messages.theme.system,
    day: messages.theme.day,
    night: messages.theme.night,
  }

  const name = user?.displayName || user?.username
  const adminPath = user?.role === 'admin' ? '/admin' : '/admin/journal'
  const adminLabel = user?.role === 'admin' ? messages.auth.adminNav : messages.auth.journalEditorNav
  const ariaLabel = user ? `${messages.auth.loggedInAs} ${name}` : messages.auth.accountMenuLabel

  return (
    <div className="settings-toggle account-toggle" ref={rootRef}>
      <button
        type="button"
        className="settings-toggle__button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon />
      </button>

      {open ? (
        <div className="settings-toggle__menu auth-menu" id={menuId} role="menu">
          {user ? (
            <>
              <div className="auth-menu__summary">
                <span>{messages.auth.loggedInAs}</span>
                <strong>{name}</strong>
                <small>{user.role}</small>
              </div>
              <Link to={adminPath} role="menuitem" onClick={close}>
                {adminLabel}
              </Link>
              <Link to="/admin/account" role="menuitem" onClick={close}>
                {messages.auth.accountNav}
              </Link>
              <button type="button" role="menuitem" onClick={() => void onLogout()}>
                {messages.auth.logout}
              </button>
              <div className="auth-menu__divider" />
            </>
          ) : (
            <>
              <Link to="/login" role="menuitem" onClick={close}>
                <UserIcon />
                <span>{messages.auth.loginNav}</span>
              </Link>
              <div className="auth-menu__divider" />
            </>
          )}

          <button
            type="button"
            className="auth-menu__section-toggle"
            aria-expanded={localeExpanded}
            onClick={() => setLocaleExpanded((value) => !value)}
          >
            <LocaleIcon preference={preference} />
            <span>
              {messages.locale.menuLabel}: {localeLabelFor(preference)}
            </span>
            <ChevronIcon open={localeExpanded} />
          </button>
          {localeExpanded &&
            localePreferences.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={preference === option.id}
                className={preference === option.id ? 'is-active' : undefined}
                onClick={() => setPreference(option.id)}
              >
                <LocaleIcon preference={option.id} />
                <span>{localeLabelFor(option.id)}</span>
              </button>
            ))}

          <div className="auth-menu__divider" />

          <button
            type="button"
            className="auth-menu__section-toggle"
            aria-expanded={themeExpanded}
            onClick={() => setThemeExpanded((value) => !value)}
          >
            <ThemeIcon mode={theme} />
            <span>
              {messages.theme.menuLabel}: {themeLabels[theme]}
            </span>
            <ChevronIcon open={themeExpanded} />
          </button>
          {themeExpanded &&
            themeModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === mode.id}
                className={theme === mode.id ? 'is-active' : undefined}
                onClick={() => setTheme(mode.id)}
              >
                <ThemeIcon mode={mode.id} />
                <span>{themeLabels[mode.id]}</span>
              </button>
            ))}
        </div>
      ) : null}
    </div>
  )
}

export default AccountMenu
