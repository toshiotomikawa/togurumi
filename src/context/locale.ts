import { createContext } from 'react'
import type { Messages } from '../i18n/messages'
import type { LocalePreference, SupportedLocale } from '../lib/i18n'

export type LocaleContextValue = {
  preference: LocalePreference
  locale: SupportedLocale
  messages: Messages
  setPreference: (preference: LocalePreference) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
