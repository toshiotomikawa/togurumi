export type LocalePreference = 'system' | 'en-US' | 'pt-BR'
export type SupportedLocale = 'en-US' | 'pt-BR'

export const LOCALE_STORAGE_KEY = 'togurumi-locale'

export const localePreferences: { id: LocalePreference; labelKey: 'system' | 'enUS' | 'ptBR' }[] = [
  { id: 'system', labelKey: 'system' },
  { id: 'en-US', labelKey: 'enUS' },
  { id: 'pt-BR', labelKey: 'ptBR' },
]

export function isLocalePreference(value: string | null): value is LocalePreference {
  return value === 'system' || value === 'en-US' || value === 'pt-BR'
}

export function readStoredLocale(): LocalePreference {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocalePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function detectSystemLocale(): SupportedLocale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language || 'en-US']

  for (const language of languages) {
    const normalized = language.toLowerCase()
    if (normalized.startsWith('pt')) return 'pt-BR'
    if (normalized.startsWith('en')) return 'en-US'
  }

  return 'en-US'
}

export function resolveLocale(preference: LocalePreference): SupportedLocale {
  if (preference === 'en-US' || preference === 'pt-BR') return preference
  return detectSystemLocale()
}

export function applyLocale(locale: SupportedLocale) {
  document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : 'en-US'
}
