import { useId, useState } from 'react'
import { useLocale } from '../hooks/useLocale'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        />
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M3 21 21 3" />
    </svg>
  )
}

type PasswordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  minLength?: number
  required?: boolean
}

function PasswordField({ label, value, onChange, autoComplete, minLength, required }: PasswordFieldProps) {
  const { messages } = useLocale()
  const [visible, setVisible] = useState(false)
  const inputId = useId()

  return (
    <label className="form-field" htmlFor={inputId}>
      <span>{label}</span>
      <div className="password-field">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="password-field__toggle"
          aria-label={visible ? messages.auth.hidePassword : messages.auth.showPassword}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </label>
  )
}

export default PasswordField
