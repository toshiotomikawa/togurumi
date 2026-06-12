import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext } from '../context/theme'
import { applyTheme, readStoredTheme, THEME_STORAGE_KEY, type ThemeMode } from '../lib/theme'

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore quota / private mode
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
