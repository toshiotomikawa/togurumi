import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/togurumi-logo.png'
import yarnBall from '../assets/togurumi-yarn-ball.png'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'
import { localePreferences, type LocalePreference } from '../lib/i18n'
import { themeModes, type ThemeMode } from '../lib/theme'
import AccountMenu, { LocaleIcon, ThemeIcon } from './AccountMenu'
import { CartIcon } from './AtelierIcons'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M16 16l4.5 4.5" />
    </svg>
  )
}

function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const { messages } = useLocale()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function submit(event: FormEvent) {
    event.preventDefault()
    const query = value.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
    setValue('')
    setOpen(false)
    onNavigate?.()
  }

  return (
    <form className={`site-search${open ? ' is-open' : ''}`} onSubmit={submit}>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (!value) setOpen(false)
        }}
        placeholder={messages.search.placeholder}
        aria-label={messages.search.ariaLabel}
      />
      <button
        type={open ? 'submit' : 'button'}
        className="settings-toggle__button"
        aria-label={messages.search.ariaLabel}
        onClick={() => {
          if (!open) setOpen(true)
        }}
      >
        <SearchIcon />
      </button>
    </form>
  )
}

function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const { messages } = useLocale()
  const { itemCount } = useCart()

  return (
    <Link to="/cart" className="settings-toggle__button cart-link" aria-label={`${messages.cart.ariaLabel} (${itemCount})`} onClick={onNavigate}>
      <CartIcon className="cart-link__svg" />
      <span className={`cart-link__badge${itemCount > 0 ? '' : ' cart-link__badge--empty'}`} aria-hidden="true">{itemCount}</span>
    </Link>
  )
}

function MobilePreferenceControls() {
  const { messages, preference, setPreference } = useLocale()
  const { theme, setTheme } = useTheme()

  const localeLabels: Record<LocalePreference, string> = {
    system: messages.locale.system,
    'en-US': messages.locale.enUS,
    'pt-BR': messages.locale.ptBR,
    'es-ES': messages.locale.esES,
  }

  const themeLabels: Record<ThemeMode, string> = {
    system: messages.theme.system,
    day: messages.theme.day,
    night: messages.theme.night,
  }

  return (
    <div className="mobile-preferences" aria-label={`${messages.locale.menuLabel} / ${messages.theme.menuLabel}`}>
      <div className="mobile-preferences__group">
        <span className="mobile-preferences__label">{messages.locale.menuLabel}</span>
        <div className="mobile-preferences__buttons" role="radiogroup" aria-label={messages.locale.menuLabel}>
          {localePreferences.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={preference === option.id}
              aria-label={`${messages.locale.menuLabel}: ${localeLabels[option.id]}`}
              title={localeLabels[option.id]}
              className={`mobile-preferences__button${preference === option.id ? ' is-active' : ''}`}
              onClick={() => setPreference(option.id)}
            >
              <LocaleIcon preference={option.id} />
            </button>
          ))}
        </div>
      </div>

      <div className="mobile-preferences__group">
        <span className="mobile-preferences__label">{messages.theme.menuLabel}</span>
        <div className="mobile-preferences__buttons" role="radiogroup" aria-label={messages.theme.menuLabel}>
          {themeModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={theme === mode.id}
              aria-label={`${messages.theme.menuLabel}: ${themeLabels[mode.id]}`}
              title={themeLabels[mode.id]}
              className={`mobile-preferences__button${theme === mode.id ? ' is-active' : ''}`}
              onClick={() => setTheme(mode.id)}
            >
              <ThemeIcon mode={mode.id} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SiteHeader() {
  const { pathname } = useLocation()
  const { messages } = useLocale()
  const [navOpen, setNavOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const panelId = 'site-mobile-panel'

  const links = [
    { to: '/', label: messages.nav.home },
    { to: '/shop', label: messages.nav.shop },
    { to: '/journal', label: messages.nav.journal },
    { to: '/faq', label: messages.nav.faq },
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

  useEffect(() => {
    if (!navOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [navOpen])

  function closeNav() {
    setNavOpen(false)
  }

  return (
    <header className="site-header" ref={rootRef}>
      <div className="site-header__inner">
        <Link to="/" className="site-brand" onClick={closeNav}>
          <span className="site-brand__mark" aria-hidden="true" style={{ maskImage: `url(${yarnBall})`, WebkitMaskImage: `url(${yarnBall})` }} />
          <img src={logo} alt="Togurumi" className="site-brand__logo" />
        </Link>
        <span className="site-header__divider" aria-hidden="true" />

        <nav className="site-nav site-nav--desktop" aria-label={messages.nav.menuLabel}>
          {links.map(({ to, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link key={to} to={to} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="site-header__actions site-header__actions--desktop">
          <SearchBox />
          <AccountMenu />
          <CartLink />
        </div>

        <button
          type="button"
          className={`site-nav-toggle${navOpen ? ' is-active' : ''}`}
          aria-label={navOpen ? messages.nav.menuCloseLabel : messages.nav.menuLabel}
          aria-expanded={navOpen}
          aria-controls={panelId}
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

      <div
        id={panelId}
        className={`site-mobile-panel${navOpen ? ' is-open' : ''}`}
        aria-hidden={!navOpen}
        // When closed, keep focusable descendants out of the tab order.
        inert={!navOpen ? true : undefined}
      >
        <nav className="site-mobile-panel__nav" aria-label={messages.nav.menuLabel}>
          {links.map(({ to, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={active ? 'is-active' : undefined}
                aria-current={active ? 'page' : undefined}
                onClick={closeNav}
                tabIndex={navOpen ? undefined : -1}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <MobilePreferenceControls />

        <div className="site-mobile-panel__actions">
          <SearchBox onNavigate={closeNav} />
          <CartLink onNavigate={closeNav} />
          <AccountMenu onNavigate={closeNav} showPreferences={false} />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
