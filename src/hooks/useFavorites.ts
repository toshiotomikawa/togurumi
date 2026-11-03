import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'togurumi-favorites'
const listeners = new Set<() => void>()
let cache: string[] | null = null

function read(): string[] {
  if (cache) return cache
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    cache = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: string[]) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cache = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const empty: string[] = []

/** Favorites are kept only in this browser (localStorage), keyed by product slug. */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => empty)
  const toggle = useCallback((slug: string) => {
    const current = read()
    write(current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug])
  }, [])
  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites])
  return { favorites, toggle, isFavorite }
}
