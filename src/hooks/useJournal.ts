import { useCallback, useEffect, useState } from 'react'
import type { SupportedLocale } from '../lib/i18n'
import {
  fetchJournalPost,
  fetchJournalPosts,
  readCachedJournalPost,
  readCachedJournalPosts,
  type JournalPost,
} from '../lib/journal'

export function useJournalPosts(locale: SupportedLocale, author?: string, includeArchived = false, managerKey?: string) {
  const requestKey = `${locale}\u0000${author ?? ''}\u0000${includeArchived}\u0000${managerKey ?? ''}`
  const [result, setResult] = useState<{ key: string; posts: JournalPost[]; error: boolean }>({
    key: '', posts: [], error: false,
  })

  const reload = useCallback(async () => {
    try {
      setResult({ key: requestKey, posts: await fetchJournalPosts(locale, author, includeArchived), error: false })
    } catch {
      const cached = readCachedJournalPosts(locale, author)
      setResult({ key: requestKey, posts: cached ?? [], error: !cached })
    }
  }, [locale, author, includeArchived, requestKey])

  useEffect(() => {
    let cancelled = false
    void fetchJournalPosts(locale, author, includeArchived)
      .then((posts) => { if (!cancelled) setResult({ key: requestKey, posts, error: false }) })
      .catch(() => {
        if (cancelled) return
        const cached = readCachedJournalPosts(locale, author)
        setResult({ key: requestKey, posts: cached ?? [], error: !cached })
      })
    return () => { cancelled = true }
  }, [locale, author, includeArchived, requestKey])

  const current = result.key === requestKey
  const cached = current ? undefined : readCachedJournalPosts(locale, author)
  return {
    posts: current ? result.posts : cached ?? [],
    loaded: current || cached !== undefined,
    error: current && result.error,
    reload,
  }
}

export function useJournalPost(
  slug: string | undefined,
  locale: SupportedLocale,
  includeArchived = false,
  managerKey?: string,
) {
  const requestKey = `${slug ?? ''}\u0000${locale}\u0000${includeArchived}\u0000${managerKey ?? ''}`
  const [result, setResult] = useState<{ key: string; post?: JournalPost; error: boolean }>({
    key: '', error: false,
  })

  useEffect(() => {
    let cancelled = false
    if (!slug) return

    void fetchJournalPost(slug, locale, includeArchived)
      .then((post) => { if (!cancelled) setResult({ key: requestKey, post, error: false }) })
      .catch(() => {
        if (cancelled) return
        const cached = readCachedJournalPost(slug, locale)
        setResult({ key: requestKey, post: cached, error: !cached })
      })

    return () => { cancelled = true }
  }, [slug, locale, includeArchived, requestKey])

  const current = result.key === requestKey
  const cached = current || !slug ? undefined : readCachedJournalPost(slug, locale)
  return {
    post: current ? result.post : cached,
    loaded: !slug || current || cached !== undefined,
    error: current && result.error,
  }
}
