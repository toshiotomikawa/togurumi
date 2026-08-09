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
  return data.posts ?? []
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
  if (response.status === 404) return undefined
  if (!response.ok) throw new Error('journal_load_failed')
  const data = await response.json() as { post?: JournalPost }
  return data.post
}
