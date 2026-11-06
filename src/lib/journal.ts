import type { SupportedLocale } from './i18n'

export type JournalPost = {
  id: string
  slug: string
  locale: SupportedLocale
  title: string
  date: string
  summary: string
  order: number
  body?: string
  author: string
  archived: boolean
}

const CACHE_PREFIX = 'togurumi-journal-v1:'
const memoryCache = new Map<string, unknown>()

function readCache<T>(key: string): T | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key) as T
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key)
    if (!stored) return undefined
    const value = JSON.parse(stored) as T
    memoryCache.set(key, value)
    return value
  } catch {
    return undefined
  }
}

function writeCache(key: string, value: unknown) {
  memoryCache.set(key, value)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    // The memory copy is enough when browser storage is blocked or full.
  }
}

function dropCache(key: string) {
  memoryCache.delete(key)
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch {
    // Nothing to remove when browser storage is blocked.
  }
}

const postsKey = (locale: SupportedLocale, author?: string) => `posts:${locale}:${author ?? ''}`
const postKey = (slug: string, locale: SupportedLocale) => `post:${locale}:${slug}`

/** The last public list seen on this device, shown at once while a fresh copy loads. */
export function readCachedJournalPosts(locale: SupportedLocale, author?: string) {
  return readCache<JournalPost[]>(postsKey(locale, author))
}

export function readCachedJournalPost(slug: string, locale: SupportedLocale) {
  return readCache<JournalPost>(postKey(slug, locale))
}

export async function fetchJournalPosts(
  locale: SupportedLocale,
  author?: string,
  includeArchived = false,
): Promise<JournalPost[]> {
  const params = new URLSearchParams({ locale })
  if (author) params.set('author', author)
  if (includeArchived) params.set('includeArchived', '1')
  const response = await fetch(`/api/public/journal?${params}`, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) throw new Error('journal_load_failed')
  const data = await response.json() as { posts?: JournalPost[] }
  const posts = data.posts ?? []
  if (!includeArchived) writeCache(postsKey(locale, author), posts)
  return posts
}

export async function fetchJournalPost(
  slug: string,
  locale: SupportedLocale,
  includeArchived = false,
): Promise<JournalPost | undefined> {
  const params = new URLSearchParams({ locale })
  if (includeArchived) params.set('includeArchived', '1')
  const response = await fetch(`/api/public/journal/${encodeURIComponent(slug)}?${params}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (response.status === 404) {
    dropCache(postKey(slug, locale))
    return undefined
  }
  if (!response.ok) throw new Error('journal_load_failed')
  const data = await response.json() as { post?: JournalPost }
  if (data.post && !includeArchived) writeCache(postKey(slug, locale), data.post)
  return data.post
}

/** Quietly loads the blog before it is opened, so a first visit to it is instant too. */
export async function preloadJournal(locale: SupportedLocale) {
  const posts = await fetchJournalPosts(locale)
  await Promise.all(
    posts
      .slice(0, 6)
      .filter((post) => !readCachedJournalPost(post.slug, locale))
      .map((post) => fetchJournalPost(post.slug, locale)),
  )
}
