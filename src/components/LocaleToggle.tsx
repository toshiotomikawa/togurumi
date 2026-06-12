import { useEffect, useId, useRef, useState } from 'react'
import { localePreferences, type LocalePreference } from '../lib/i18n'
import { useLocale } from '../hooks/useLocale'

function LocaleIcon({ preference }: { preference: LocalePreference }) {
  if (preference === 'en-US') {
    return <span className="settings-toggle__glyph">EN</span>
  }

  if (preference === 'pt-BR') {
    return <span className="settings-toggle__glyph">PT</span>
  }

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

function LocaleToggle() {
  const { preference, messages, setPreference } = useLocale()
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

  const labelFor = (id: LocalePreference) => {
    if (id === 'system') return messages.locale.system
    if (id === 'en-US') return messages.locale.enUS
    return messages.locale.ptBR
  }

  const currentLabel = labelFor(preference)

  return (
    <div className="settings-toggle" ref={rootRef}>
      <button
        type="button"
        className="settings-toggle__button"
        aria-label={`${messages.locale.menuLabel}: ${currentLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <LocaleIcon preference={preference} />
      </button>

      {open ? (
        <div className="settings-toggle__menu" id={menuId} role="menu" aria-label={messages.locale.menuLabel}>
          {localePreferences.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={preference === option.id}
              className={preference === option.id ? 'is-active' : undefined}
              onClick={() => {
                setPreference(option.id)
                setOpen(false)
              }}
            >
              <LocaleIcon preference={option.id} />
              <span>{labelFor(option.id)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default LocaleToggle
