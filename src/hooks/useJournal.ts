import { useCallback, useEffect, useState } from 'react'
import type { SupportedLocale } from '../lib/i18n'
import { fetchJournalPost, fetchJournalPosts, type JournalPost } from '../lib/journal'

export function useJournalPosts(locale: SupportedLocale, author?: string, includeArchived = false, managerKey?: string) {
  const requestKey = `${locale}\u0000${author ?? ''}\u0000${includeArchived}\u0000${managerKey ?? ''}`
  const [result, setResult] = useState<{ key: string; posts: JournalPost[] }>({ key: '', posts: [] })

  const reload = useCallback(async () => {
    try {
      setResult({ key: requestKey, posts: await fetchJournalPosts(locale, author, includeArchived) })
    } catch {
      setResult({ key: requestKey, posts: [] })
    }
  }, [locale, author, includeArchived, requestKey])

  useEffect(() => {
    let cancelled = false
    void fetchJournalPosts(locale, author, includeArchived)
      .then((posts) => { if (!cancelled) setResult({ key: requestKey, posts }) })
      .catch(() => { if (!cancelled) setResult({ key: requestKey, posts: [] }) })
    return () => { cancelled = true }
  }, [locale, author, includeArchived, requestKey])

  return { posts: result.key === requestKey ? result.posts : [], loaded: result.key === requestKey, reload }
}

export function useJournalPost(
  slug: string | undefined,
  locale: SupportedLocale,
  includeArchived = false,
  managerKey?: string,
) {
  const requestKey = `${slug ?? ''}\u0000${locale}\u0000${includeArchived}\u0000${managerKey ?? ''}`
  const [result, setResult] = useState<{ key: string; post?: JournalPost }>({ key: '' })

  useEffect(() => {
    let cancelled = false
    if (!slug) return

    void fetchJournalPost(slug, locale, includeArchived)
      .then((post) => { if (!cancelled) setResult({ key: requestKey, post }) })
      .catch(() => { if (!cancelled) setResult({ key: requestKey }) })

    return () => { cancelled = true }
  }, [slug, locale, includeArchived, requestKey])

  return {
    post: result.key === requestKey ? result.post : undefined,
    loaded: !slug || result.key === requestKey,
  }
}
