import { useEffect, useId, useRef, useState } from 'react'
import { themeModes, type ThemeMode } from '../lib/theme'
import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'

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

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { messages } = useLocale()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const labels: Record<ThemeMode, string> = {
    system: messages.theme.system,
    day: messages.theme.day,
    night: messages.theme.night,
  }

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

  return (
    <div className="settings-toggle" ref={rootRef}>
      <button
        type="button"
        className="settings-toggle__button"
        aria-label={`${messages.theme.menuLabel}: ${labels[theme]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeIcon mode={theme} />
      </button>

      {open ? (
        <div className="settings-toggle__menu" id={menuId} role="menu" aria-label={messages.theme.menuLabel}>
          {themeModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === mode.id}
              className={theme === mode.id ? 'is-active' : undefined}
              onClick={() => {
                setTheme(mode.id)
                setOpen(false)
              }}
            >
              <ThemeIcon mode={mode.id} />
              <span>{labels[mode.id]}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ThemeToggle
