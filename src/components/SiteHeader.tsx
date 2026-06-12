import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/togurumi-logo.png'
import { useLocale } from '../hooks/useLocale'
import LocaleToggle from './LocaleToggle'
import ThemeToggle from './ThemeToggle'

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
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
