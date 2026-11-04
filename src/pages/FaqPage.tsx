import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DragHandleIcon, EditIcon } from '../components/EditableContent'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { getFaqContent as getStaticFaqContent } from '../i18n/faq'
import type { FaqContent } from '../lib/faq'

type Feedback = {
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

function cloneFaq(faq: FaqContent): FaqContent {
  return { ...faq, items: faq.items.map((item) => ({ ...item })) }
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Renders the `[label](/path)` links editors can write inside an answer. */
function renderAnswer(answer: string) {
  return answer.split(/(\[[^\]]+\]\(\/[^)]+\))/g).map((part, index) => {
    const match = /^\[([^\]]+)\]\((\/[^)]+)\)$/.exec(part)
    return match ? (
      <Link key={index} to={match[2]}>
        {match[1]}
      </Link>
    ) : (
      part
    )
  })
}

function FaqPage() {
  const { locale, messages } = useLocale()
  const { user, logout } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'moderator'

  const [faq, setFaq] = useState<FaqContent>(() => getStaticFaqContent(locale))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FaqContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const overIndexRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadFaq() {
      if (cancelled) return
      setEditing(false)
      setDraft(null)
      setFeedback(null)

      try {
        const { faq: loaded } = await apiRequest<{ faq: FaqContent }>(`/api/faq/${locale}`, undefined, logout)
        if (!cancelled) setFaq(loaded)
      } catch {
        if (!cancelled) setFaq(getStaticFaqContent(locale))
      }
    }

    void loadFaq()

    return () => {
      cancelled = true
    }
  }, [locale, logout])

  function startEditing() {
    setDraft(cloneFaq(faq))
    setFeedback(null)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(null)
    setEditing(false)
    setFeedback(null)
  }

  function updateDraft(updater: (current: FaqContent) => FaqContent) {
    setDraft((current) => (current ? updater(current) : current))
  }

  function addItem() {
    updateDraft((current) => ({
      ...current,
      items: [...current.items, { question: '', answer: '' }],
    }))
  }

  function removeItem(index: number) {
    updateDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function moveItemByOffset(index: number, offset: number) {
    const target = index + offset
    updateDraft((current) => {
      if (target < 0 || target >= current.items.length) return current
      return { ...current, items: moveItem(current.items, index, target) }
    })
  }

  function startDrag(index: number) {
    dragIndexRef.current = index
    overIndexRef.current = index
    setDragIndex(index)
    setOverIndex(index)
  }

  useEffect(() => {
    if (dragIndex === null) return

    function handlePointerMove(event: PointerEvent) {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      const itemEl = target instanceof Element ? target.closest<HTMLElement>('[data-faq-index]') : null
      if (!itemEl) return

      const index = Number(itemEl.dataset.faqIndex)
      if (Number.isNaN(index) || index === overIndexRef.current) return

      overIndexRef.current = index
      setOverIndex(index)
    }

    function finishDrag() {
      const from = dragIndexRef.current
      const to = overIndexRef.current
      if (from !== null && to !== null && from !== to) {
        updateDraft((current) => ({ ...current, items: moveItem(current.items, from, to) }))
      }

      dragIndexRef.current = null
      overIndexRef.current = null
      setDragIndex(null)
      setOverIndex(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [dragIndex])

  async function save() {
    if (!draft) return
    setSaving(true)
    setFeedback(null)

    try {
      const { faq: saved } = await apiRequest<{ faq: FaqContent }>(
        `/api/faq/${locale}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) },
        logout,
      )
      setFaq(saved)
      setDraft(null)
      setEditing(false)
      setFeedback({ kind: 'success', text: messages.faqEditor.saveSuccess })
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setFeedback({ kind: 'error', text: messages.faqEditor.saveError })
      }
    } finally {
      setSaving(false)
    }
  }

  if (editing && draft) {
    return (
      <div className="page page--faq page--faq-editing">
        <section className="faq-hero faq-hero--editing">
          <label className="form-field">
            <span>{messages.faqEditor.eyebrowLabel}</span>
            <input
              type="text"
              value={draft.eyebrow}
              onChange={(event) => updateDraft((current) => ({ ...current, eyebrow: event.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>{messages.faqEditor.titleLabel}</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>{messages.faqEditor.introLabel}</span>
            <textarea
              value={draft.intro}
              onChange={(event) => updateDraft((current) => ({ ...current, intro: event.target.value }))}
              rows={3}
            />
          </label>
        </section>

        <div className="faq-list faq-list--editing" role="list" aria-label={messages.faqEditor.questionLabel}>
          {draft.items.map((item, index) => (
            <div
              className={`faq-item faq-item--editing${dragIndex === index ? ' faq-item--dragging' : ''}${
                overIndex === index && dragIndex !== null && dragIndex !== index ? ' faq-item--drag-over' : ''
              }`}
              key={index}
              data-faq-index={index}
              role="listitem"
            >
              <div className="faq-item__row">
                <div className="faq-item__controls">
                  <button
                    type="button"
                    className="faq-item__drag-handle"
                    aria-label={messages.faqEditor.reorderLabel}
                    title={messages.faqEditor.reorderLabel}
                    disabled={saving}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      startDrag(index)
                    }}
                  >
                    <DragHandleIcon />
                  </button>
                  <button
                    type="button"
                    className="button faq-item__move"
                    aria-label={messages.faqEditor.moveUp}
                    title={messages.faqEditor.moveUp}
                    disabled={saving || index === 0}
                    onClick={() => moveItemByOffset(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="button faq-item__move"
                    aria-label={messages.faqEditor.moveDown}
                    title={messages.faqEditor.moveDown}
                    disabled={saving || index === draft.items.length - 1}
                    onClick={() => moveItemByOffset(index, 1)}
                  >
                    ↓
                  </button>
                </div>
                <div className="faq-item__fields">
                  <label className="form-field">
                    <span>{messages.faqEditor.questionLabel}</span>
                    <input
                      type="text"
                      value={item.question}
                      disabled={saving}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          items: current.items.map((entry, itemIndex) =>
                            itemIndex === index ? { ...entry, question: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span>{messages.faqEditor.answerLabel}</span>
                    <textarea
                      value={item.answer}
                      disabled={saving}
                      rows={4}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          items: current.items.map((entry, itemIndex) =>
                            itemIndex === index ? { ...entry, answer: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button button--danger"
                    disabled={saving}
                    onClick={() => removeItem(index)}
                  >
                    {messages.faqEditor.removeItem}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {draft.items.length === 0 ? (
          <div className="faq-empty faq-empty--editing">
            <p className="faq-empty__title">{messages.faq.emptyTitle}</p>
            <p className="faq-empty__body">{messages.faq.emptyBody}</p>
          </div>
        ) : null}

        <div className="faq-editor__actions">
          <button type="button" className="button" onClick={addItem} disabled={saving}>
            {messages.faqEditor.addItem}
          </button>
          <button type="button" className="button button--primary" onClick={() => void save()} disabled={saving}>
            {messages.faqEditor.save}
          </button>
          <button type="button" className="button" onClick={cancelEditing} disabled={saving}>
            {messages.faqEditor.cancel}
          </button>
        </div>

        {feedback && (
          <p
            className={`editor-feedback editor-feedback--${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            {feedback.text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="page page--faq">
      <section className="faq-hero">
        <span className="faq-hero__eyebrow">{faq.eyebrow}</span>
        <h1 className="faq-hero__title">{faq.title}</h1>
        <p className="faq-hero__intro">{faq.intro}</p>
      </section>

      {canEdit && (
        <div className="faq-editor__actions faq-editor__actions--view">
          <button
            type="button"
            className="button icon-button"
            onClick={startEditing}
            aria-label={messages.faqEditor.editButton}
            title={messages.faqEditor.editButton}
          >
            <EditIcon />
          </button>
        </div>
      )}

      {feedback && (
        <p
          className={`editor-feedback editor-feedback--${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      )}

      {faq.items.length > 0 ? (
        <div className="faq-list">
          {faq.items.map((item, index) => (
            <details className="faq-item" key={`${index}-${item.question}`}>
              <summary>
                <span className="faq-item__question">{item.question}</span>
                <span className="faq-item__indicator" aria-hidden="true" />
              </summary>
              <div className="faq-item__answer">
                <p>{renderAnswer(item.answer)}</p>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="faq-empty">
          <p className="faq-empty__title">{messages.faq.emptyTitle}</p>
          <p className="faq-empty__body">{messages.faq.emptyBody}</p>
        </div>
      )}
    </div>
  )
}

export default FaqPage
