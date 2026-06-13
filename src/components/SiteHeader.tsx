import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import cartIcon from '../assets/shopping-cart.png'
import logo from '../assets/togurumi-logo.png'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import AccountMenu from './AccountMenu'

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
    <Link to="/cart" className="settings-toggle__button cart-link" aria-label={messages.cart.ariaLabel} onClick={onNavigate}>
      <span
        aria-hidden="true"
        className="cart-link__icon"
        style={{ maskImage: `url(${cartIcon})`, WebkitMaskImage: `url(${cartIcon})` }}
      />
      {itemCount > 0 && <span className="cart-link__badge">{itemCount}</span>}
    </Link>
  )
}

function SiteHeader() {
  const { pathname } = useLocation()
  const { messages } = useLocale()
  const [navOpen, setNavOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  const links = [
    { to: '/', label: messages.nav.home },
    { to: '/shop', label: messages.nav.shop },
    { to: '/journal', label: messages.nav.journal },
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
          <SearchBox />
          <CartLink />
          <AccountMenu />
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
          <SearchBox onNavigate={closeNav} />
          <CartLink onNavigate={closeNav} />
          <AccountMenu onNavigate={closeNav} />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
