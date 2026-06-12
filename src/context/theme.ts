import { createContext } from 'react'
import type { ThemeMode } from '../lib/theme'

export type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
