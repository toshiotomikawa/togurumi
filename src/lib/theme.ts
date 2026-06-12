export type ThemeMode = 'system' | 'day' | 'night'

export const THEME_STORAGE_KEY = 'togurumi-theme'

export const themeModes: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
]

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'day' || value === 'night'
}

export function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
}
