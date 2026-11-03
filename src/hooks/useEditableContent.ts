import { useEffect, useState } from 'react'
import type { SupportedLocale } from '../lib/i18n'
import type { SiteContentMap, SiteContentSection } from '../lib/siteContent'
import { useAuth } from './useAuth'

const DRAFT_STORAGE_PREFIX = 'togurumi-content-draft'
const DRAFT_AUTOSAVE_MS = 800

function draftStorageKey(section: string, locale: string) {
  return `${DRAFT_STORAGE_PREFIX}:${section}:${locale}`
}

function readDraftBackup<Content>(section: string, locale: string): Content | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(section, locale))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { draft?: Content }
    return parsed.draft ?? null
  } catch {
    return null
  }
}

function writeDraftBackup<Content>(section: string, locale: string, draft: Content) {
  try {
    localStorage.setItem(
      draftStorageKey(section, locale),
      JSON.stringify({ draft, savedAt: new Date().toISOString() }),
    )
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

function clearDraftBackup(section: string, locale: string) {
  try {
    localStorage.removeItem(draftStorageKey(section, locale))
  } catch {
    // Ignore.
  }
}

// Last published content, kept per browser so a returning visitor sees the real text on the
// first paint. Separate from the editor's draft key above, which may hold unpublished text.
const PUBLIC_CACHE_PREFIX = 'togurumi-content-public'
// How long a first-time visitor waits for /api/content before the built-in text is shown.
export const CONTENT_WAIT_MS = 2500

function publicCacheKey(section: string, locale: string) {
  return `${PUBLIC_CACHE_PREFIX}:${section}:${locale}`
}

function readPublicCache(section: string, locale: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(publicCacheKey(section, locale))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null
  } catch {
    return null
  }
}

function writePublicCache(section: string, locale: string, content: Record<string, string>) {
  try {
    localStorage.setItem(publicCacheKey(section, locale), JSON.stringify(content))
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

type ContentState<Content> = {
  key: string
  content: Content
  // True once the text on screen is final: cached, loaded, or the fallback after the wait.
  ready: boolean
  // True when the wait ran out (or the API failed) and the built-in text is on screen.
  // A visitor then keeps that text instead of seeing it swapped a moment later.
  settledOnFallback: boolean
}

function initialContentState<Content>(key: string, section: string, locale: string, fallback: Content): ContentState<Content> {
  const cached = readPublicCache(section, locale)
  return cached
    ? { key, content: { ...fallback, ...cached } as Content, ready: true, settledOnFallback: false }
    : { key, content: fallback, ready: false, settledOnFallback: false }
}

export type EditableFeedback = {
  kind: 'success' | 'error'
  text: string
}

function getErrorCode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const error = (payload as { error?: unknown }).error
  return typeof error === 'string' ? error : null
}

async function readResponseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function createApiError(code: string) {
  const error = new Error(code) as Error & { code: string }
  error.code = code
  return error
}

export function getApiErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : null
}

async function apiRequest<T>(url: string, init: RequestInit | undefined, onUnauthorized: () => Promise<void>) {
  let response: Response

  try {
    response = await fetch(url, { ...init, credentials: 'include' })
  } catch {
    throw createApiError('network')
  }

  if (response.status === 401) {
    await onUnauthorized()
    throw createApiError('unauthorized')
  }

  if (!response.ok) {
    try {
      const payload = (await response.json()) as unknown
      throw createApiError(getErrorCode(payload) ?? 'generic')
    } catch (error) {
      if (getApiErrorCode(error)) throw error
      throw createApiError('generic')
    }
  }

  return readResponseJson<T>(response)
}

export function useEditableContent<Section extends SiteContentSection>(
  section: Section,
  locale: SupportedLocale,
  fallback: SiteContentMap[Section],
  draftRestoredMessage?: string,
) {
  type Content = SiteContentMap[Section]

  const { user, logout } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'moderator'

  // The page never paints the built-in text and then replaces it with the published one.
  // Until the text is known, `ready` is false and pages hide the editable text (keeping its
  // space); it turns true with the cached copy, the loaded copy, or the fallback after
  // CONTENT_WAIT_MS or an API error, so a failing API never leaves a blank block.
  const contentKey = `${section}:${locale}`
  const [state, setState] = useState<ContentState<Content>>(() => initialContentState(contentKey, section, locale, fallback))
  if (state.key !== contentKey) {
    setState(initialContentState(contentKey, section, locale, fallback))
  }
  const content = state.content
  const ready = state.ready
  const setContent = (next: Content) => setState((current) => ({ ...current, content: next, ready: true }))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Content | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<EditableFeedback | null>(null)

  useEffect(() => {
    let cancelled = false

    function restoreDraftBackup() {
      const backup = canEdit ? readDraftBackup<Content>(section, locale) : null
      if (backup) {
        setDraft(backup)
        setEditing(true)
        if (draftRestoredMessage) {
          setFeedback({ kind: 'success', text: draftRestoredMessage })
        }
        return
      }

      setDraft(null)
      setEditing(false)
    }

    const waitTimer = window.setTimeout(() => {
      if (cancelled) return
      setState((current) => (current.ready ? current : { ...current, ready: true, settledOnFallback: true }))
    }, CONTENT_WAIT_MS)

    async function load() {
      if (cancelled) return
      setFeedback(null)

      try {
        const { content: loaded } = await apiRequest<{ content: Record<string, string> }>(
          `/api/content/${locale}/${section}`,
          undefined,
          logout,
        )
        if (cancelled) return
        window.clearTimeout(waitTimer)
        writePublicCache(section, locale, loaded ?? {})
        const merged = { ...fallback, ...loaded } as Content
        setState((current) => {
          // A visitor already reading the fallback keeps it (the next visit uses the cache).
          // Editors always get the published text, so they never edit or save the fallback.
          if (current.settledOnFallback && !canEdit) return current
          return { ...current, content: merged, ready: true }
        })
        restoreDraftBackup()
      } catch {
        if (cancelled) return
        window.clearTimeout(waitTimer)
        setState((current) => (current.ready ? current : { ...current, ready: true, settledOnFallback: true }))
        restoreDraftBackup()
      }
    }

    void load()

    return () => {
      cancelled = true
      window.clearTimeout(waitTimer)
    }
  }, [locale, section, fallback, logout, canEdit, draftRestoredMessage])

  useEffect(() => {
    if (!editing || !draft) return

    const timer = window.setTimeout(() => {
      writeDraftBackup(section, locale, draft)
    }, DRAFT_AUTOSAVE_MS)

    return () => window.clearTimeout(timer)
  }, [draft, editing, section, locale])

  useEffect(() => {
    if (!editing || !draft) return

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [editing, draft])

  function startEditing() {
    const nextDraft = { ...content }
    setDraft(nextDraft)
    writeDraftBackup(section, locale, nextDraft)
    setFeedback(null)
    setEditing(true)
  }

  function cancelEditing() {
    clearDraftBackup(section, locale)
    setDraft(null)
    setEditing(false)
    setFeedback(null)
  }

  function updateField(key: keyof Content, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  async function save(messages: { saveSuccess: string; saveError: string }) {
    if (!draft) return
    setSaving(true)
    setFeedback(null)

    try {
      const { content: saved } = await apiRequest<{ content: Record<string, string> }>(
        `/api/content/${locale}/${section}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) },
        logout,
      )
      setContent({ ...fallback, ...saved } as Content)
      writePublicCache(section, locale, saved ?? {})
      clearDraftBackup(section, locale)
      setDraft(null)
      setEditing(false)
      setFeedback({ kind: 'success', text: messages.saveSuccess })
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: messages.saveError })
      }
    } finally {
      setSaving(false)
    }
  }

  // Class for the element that holds editable text: hides it (keeping its space) until ready.
  const pendingClass = ready ? '' : ' content-pending'

  return { canEdit, content, ready, pendingClass, editing, draft, startEditing, cancelEditing, updateField, save, saving, feedback }
}
