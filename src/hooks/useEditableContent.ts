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

  const [content, setContent] = useState<Content>(fallback)
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
        const merged = { ...fallback, ...loaded } as Content
        setContent(merged)
        restoreDraftBackup()
      } catch {
        if (cancelled) return
        setContent(fallback)
        restoreDraftBackup()
      }
    }

    void load()

    return () => {
      cancelled = true
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

  return { canEdit, content, editing, draft, startEditing, cancelEditing, updateField, save, saving, feedback }
}
