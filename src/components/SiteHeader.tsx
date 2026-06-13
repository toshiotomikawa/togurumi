import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/togurumi-logo.png'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import LocaleToggle from './LocaleToggle'
import ThemeToggle from './ThemeToggle'

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

function AuthControl({ onNavigate }: { onNavigate?: () => void }) {
  const { messages } = useLocale()
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

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

  if (loading) return null

  if (!user) {
    return (
      <Link to="/login" className="auth-nav-link" onClick={onNavigate}>
        <UserIcon />
        <span>{messages.auth.loginNav}</span>
      </Link>
    )
  }

  const name = user.displayName || user.username
  const adminPath = user.role === 'admin' ? '/admin' : '/admin/journal'
  const adminLabel = user.role === 'admin' ? messages.auth.adminNav : messages.auth.journalEditorNav

  return (
    <div className="settings-toggle auth-toggle" ref={rootRef}>
      <button
        type="button"
        className="settings-toggle__button"
        aria-label={`${messages.auth.loggedInAs} ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon />
      </button>

      {open ? (
        <div className="settings-toggle__menu auth-menu" id={menuId} role="menu">
          <div className="auth-menu__summary">
            <span>{messages.auth.loggedInAs}</span>
            <strong>{name}</strong>
            <small>{user.role}</small>
          </div>
          <Link
            to={adminPath}
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
          >
            {adminLabel}
          </Link>
          <Link
            to="/admin/account"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
          >
            {messages.auth.accountNav}
          </Link>
          <button type="button" role="menuitem" onClick={() => void onLogout()}>
            {messages.auth.logout}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function SiteHeader() {
  const { pathname } = useLocation()
  const { messages } = useLocale()
  const [navOpen, setNavOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  const links = [
    { to: '/', label: messages.nav.home },
    { to: '/gallery', label: messages.nav.gallery },
    { to: '/patterns', label: messages.nav.patterns },
    { to: '/journal', label: messages.nav.journal },
    { to: '/about', label: messages.nav.about },
    { to: '/contact', label: messages.nav.contact },
  ]

  useEffect(() => {
    if (!navOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setNavOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [navOpen])

  function closeNav() {
    setNavOpen(false)
  }

  return (
    <header className="site-header" ref={rootRef}>
      <div className="site-header__inner">
        <Link to="/" className="site-brand" onClick={closeNav}>
          <img src={logo} alt="Togurumi" className="site-brand__logo" />
        </Link>

        <nav className="site-nav site-nav--desktop" aria-label="Main">
          {links.map(({ to, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={active ? 'is-active' : undefined}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="site-header__actions site-header__actions--desktop">
          <AuthControl />
          <LocaleToggle />
          <ThemeToggle />
        </div>

        <button
          type="button"
          className={`site-nav-toggle${navOpen ? ' is-active' : ''}`}
          aria-label="Main menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              d={navOpen ? 'M5 5l14 14M19 5L5 19' : 'M4 7h16M4 12h16M4 17h16'}
            />
          </svg>
        </button>
      </div>

      <div className={`site-mobile-panel${navOpen ? ' is-open' : ''}`}>
        <nav className="site-mobile-panel__nav" aria-label="Main">
          {links.map(({ to, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={active ? 'is-active' : undefined} onClick={closeNav}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="site-mobile-panel__actions">
          <AuthControl onNavigate={closeNav} />
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
