import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import type { SupportedLocale } from '../lib/i18n'

type JournalPostRecord = {
  id: string
  slug: string
  locale: SupportedLocale
  title: string
  date: string
  order: number
  summary: string
}

type JournalPost = JournalPostRecord & {
  body: string
}

type JournalFormState = {
  slug: string
  locale: SupportedLocale
  title: string
  date: string
  order: string
  summary: string
  body: string
}

type Feedback = {
  kind: 'success' | 'error'
  text: string
}

const localeOptions: SupportedLocale[] = ['en-US', 'pt-BR', 'es-ES']

function createEmptyForm(): JournalFormState {
  return {
    slug: '',
    locale: 'en-US',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    order: '0',
    summary: '',
    body: '',
  }
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

function getApiErrorCode(error: unknown) {
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

function JournalEditorPage() {
  const { messages } = useLocale()
  const { logout } = useAuth()
  const [posts, setPosts] = useState<JournalPostRecord[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<JournalFormState>(() => createEmptyForm())
  const [saving, setSaving] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)

    try {
      const { posts: nextPosts } = await apiRequest<{ posts: JournalPostRecord[] }>('/api/journal', undefined, logout)
      setPosts(nextPosts)
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: messages.auth.genericError })
      }
    } finally {
      setLoadingPosts(false)
    }
  }, [logout, messages.auth.genericError])

  useEffect(() => {
    let cancelled = false

    async function loadInitialPosts() {
      try {
        const { posts: nextPosts } = await apiRequest<{ posts: JournalPostRecord[] }>('/api/journal', undefined, logout)
        if (!cancelled) setPosts(nextPosts)
      } catch (error) {
        if (!cancelled && getApiErrorCode(error) !== 'unauthorized') {
          setFeedback({ kind: 'error', text: messages.auth.genericError })
        }
      } finally {
        if (!cancelled) setLoadingPosts(false)
      }
    }

    void loadInitialPosts()

    return () => {
      cancelled = true
    }
  }, [logout, messages.auth.genericError])

  const groupedPosts = useMemo(() => {
    const sortedPosts = [...posts].sort(
      (a, b) => a.slug.localeCompare(b.slug) || a.locale.localeCompare(b.locale),
    )
    const groups: { slug: string; posts: JournalPostRecord[] }[] = []

    for (const post of sortedPosts) {
      const currentGroup = groups.at(-1)
      if (currentGroup?.slug === post.slug) {
        currentGroup.posts.push(post)
      } else {
        groups.push({ slug: post.slug, posts: [post] })
      }
    }

    return groups
  }, [posts])

  function updateField<K extends keyof JournalFormState>(field: K, value: JournalFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function startNewPost() {
    setFeedback(null)
    setEditingId(null)
    setForm(createEmptyForm())
    setFormVisible(true)
  }

  async function startEditPost(id: string) {
    setFeedback(null)

    try {
      const { post } = await apiRequest<{ post: JournalPost }>(`/api/journal/${id}`, undefined, logout)
      setEditingId(post.id)
      setForm({
        slug: post.slug,
        locale: post.locale,
        title: post.title,
        date: post.date,
        order: String(post.order),
        summary: post.summary,
        body: post.body,
      })
      setFormVisible(true)
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: messages.auth.genericError })
      }
    }
  }

  function cancelForm() {
    setFormVisible(false)
    setEditingId(null)
    setForm(createEmptyForm())
  }

  function formatSaveError(error: unknown) {
    const code = getApiErrorCode(error)
    return code && code !== 'unauthorized' ? `${messages.auth.saveError} (${code})` : messages.auth.saveError
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)

    const payload = {
      slug: form.slug,
      locale: form.locale,
      title: form.title,
      date: form.date,
      order: Number(form.order) || 0,
      summary: form.summary,
      body: form.body,
    }

    try {
      if (editingId) {
        await apiRequest<JournalPost>(`/api/journal/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, logout)
      } else {
        await apiRequest<JournalPost>('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, logout)
      }

      setFeedback({ kind: 'success', text: messages.auth.saveSuccess })
      setFormVisible(false)
      setEditingId(null)
      setForm(createEmptyForm())
      await loadPosts()
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: formatSaveError(error) })
      }
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(post: JournalPostRecord) {
    if (!window.confirm(messages.auth.deleteConfirm)) return

    setFeedback(null)

    try {
      await apiRequest<{ ok: true }>(`/api/journal/${post.id}`, { method: 'DELETE' }, logout)
      setFeedback({ kind: 'success', text: messages.auth.deleteSuccess })
      await loadPosts()
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: messages.auth.genericError })
      }
    }
  }

  return (
    <div className="page journal-editor-page">
      <section className="section editor-head">
        <div>
          <span className="hero__eyebrow">{messages.auth.journalEditorNav}</span>
          <h1>{messages.auth.editorTitle}</h1>
        </div>
        <button type="button" className="button button--primary" onClick={startNewPost}>
          {messages.auth.newPost}
        </button>
      </section>

      {feedback ? (
        <p className={`editor-feedback editor-feedback--${feedback.kind}`} role="status">
          {feedback.text}
        </p>
      ) : null}

      {formVisible ? (
        <form className="card editor-form" onSubmit={onSubmit}>
          <div className="section__head">
            <h2>{editingId ? messages.auth.editPost : messages.auth.newPost}</h2>
            <button type="button" className="button" onClick={cancelForm}>
              {messages.auth.cancel}
            </button>
          </div>

          <div className="editor-form-grid">
            <label className="form-field">
              <span>{messages.auth.fieldSlug}</span>
              <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} required />
            </label>

            <label className="form-field">
              <span>{messages.auth.fieldLocale}</span>
              <select
                value={form.locale}
                onChange={(event) => updateField('locale', event.target.value as SupportedLocale)}
                required
              >
                {localeOptions.map((locale) => (
                  <option value={locale} key={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>{messages.auth.fieldTitle}</span>
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            </label>

            <label className="form-field">
              <span>{messages.auth.fieldDate}</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField('date', event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>{messages.auth.fieldOrder}</span>
              <input
                type="number"
                value={form.order}
                onChange={(event) => updateField('order', event.target.value)}
                required
              />
            </label>

            <label className="form-field field--wide">
              <span>{messages.auth.fieldSummary}</span>
              <textarea
                rows={3}
                value={form.summary}
                onChange={(event) => updateField('summary', event.target.value)}
                required
              />
            </label>

            <label className="form-field field--wide">
              <span>{messages.auth.fieldBody}</span>
              <textarea
                className="editor-body"
                rows={16}
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                required
              />
            </label>
          </div>

          <div className="editor-form-actions">
            <button type="submit" className="button button--primary" disabled={saving}>
              {messages.auth.save}
            </button>
            <button type="button" className="button" onClick={cancelForm}>
              {messages.auth.cancel}
            </button>
          </div>
        </form>
      ) : null}

      <div className="journal-editor-list">
        {loadingPosts ? (
          <div className="auth-route-loading" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
          </div>
        ) : null}

        {groupedPosts.map((group) => (
          <section className="card editor-post-group" key={group.slug}>
            <h2>{group.slug}</h2>
            <div className="editor-post-rows">
              {group.posts.map((post) => (
                <article className="editor-post-row" key={post.id}>
                  <div>
                    <h3>{post.title}</h3>
                    <p className="journal-card__meta">
                      <span className="locale-badge">{post.locale}</span>
                      <span>{post.date}</span>
                    </p>
                  </div>
                  <div className="editor-row-actions">
                    <button type="button" className="button" onClick={() => void startEditPost(post.id)}>
                      {messages.auth.editPost}
                    </button>
                    <button type="button" className="button button--danger" onClick={() => void deletePost(post)}>
                      {messages.auth.deletePost}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default JournalEditorPage
