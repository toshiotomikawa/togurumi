import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext, type LocaleContextValue } from '../context/locale'
import { getMessages } from '../i18n/messages'
import {
  applyLocale,
  detectSystemLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  type LocalePreference,
  type SupportedLocale,
} from '../lib/i18n'

function LocaleProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>(() => readStoredLocale())
  const [systemLocale, setSystemLocale] = useState<SupportedLocale>(() => detectSystemLocale())

  useEffect(() => {
    function syncSystemLocale() {
      setSystemLocale(detectSystemLocale())
    }

    window.addEventListener('languagechange', syncSystemLocale)
    return () => window.removeEventListener('languagechange', syncSystemLocale)
  }, [])

  const locale = useMemo(() => (preference === 'system' ? systemLocale : preference), [preference, systemLocale])

  const messages = useMemo(() => getMessages(locale), [locale])

  useEffect(() => {
    applyLocale(locale)
    document.title = messages.meta.title

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, preference)
    } catch {
      // ignore quota / private mode
    }
  }, [locale, messages.meta.title, preference])

  const value = useMemo<LocaleContextValue>(
    () => ({ preference, locale, messages, setPreference: setPreferenceState }),
    [preference, locale, messages],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export default LocaleProvider
