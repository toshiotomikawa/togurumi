import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { formatReviewDate, type ReviewRecord } from '../lib/reviews'
import { StarIcon } from './AtelierIcons'
import { EditActions, EditFeedback, EditField } from './EditableContent'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? 'is-filled' : undefined}>
          <StarIcon />
        </span>
      ))}
    </span>
  )
}

function StarPicker({ value, label, onChange }: { value: number; label: string; onChange: (rating: number) => void }) {
  return (
    <div className="review-star-picker" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'is-filled' : undefined}
          aria-label={`${label}: ${star}/5`}
          aria-pressed={star === value}
          onClick={() => onChange(star)}
        >
          <StarIcon />
        </button>
      ))}
    </div>
  )
}

function ReviewsSection() {
  const { messages, locale } = useLocale()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const editor = useEditableContent('reviews', locale, messages.reviews, messages.contentEditor.draftRestored)

  const loadReviews = useCallback(() => {
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : { reviews: [] }))
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => setReviews([]))
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    if (window.location.hash === '#reviews') {
      document.getElementById('reviews')?.scrollIntoView()
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error === 'too_many_attempts' ? messages.reviews.errorTooMany : messages.reviews.errorGeneric)
        setStatus('error')
        return
      }

      setName('')
      setRating(5)
      setComment('')
      setStatus('success')
      loadReviews()
    } catch {
      setError(messages.reviews.errorGeneric)
      setStatus('error')
    }
  }

  async function onRemove(id: string) {
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    if (res.ok) setReviews((current) => current.filter((review) => review.id !== id))
  }

  const canModerate = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <section className={`section home-reviews${editor.pendingClass}`} id="reviews">
      {editor.editing && editor.draft ? (
        <div className="content-editor__fields">
          <EditField
            label={messages.contentEditor.fields.eyebrow}
            value={editor.draft.eyebrow}
            onChange={(value) => editor.updateField('eyebrow', value)}
          />
          <EditField
            label={messages.contentEditor.fields.title}
            value={editor.draft.title}
            onChange={(value) => editor.updateField('title', value)}
          />
          <EditField
            label={messages.contentEditor.fields.intro}
            value={editor.draft.intro}
            multiline
            onChange={(value) => editor.updateField('intro', value)}
          />
        </div>
      ) : (
        <div className="home-reviews__intro editable-text">
          <span className="hero__eyebrow">{editor.content.eyebrow}</span>
          <h2>{editor.content.title}</h2>
          <p>{editor.content.intro}</p>
        </div>
      )}

      {editor.canEdit && (
        <EditActions
          editLabel={messages.contentEditor.editButton}
          saveLabel={messages.contentEditor.save}
          cancelLabel={messages.contentEditor.cancel}
          editing={editor.editing}
          saving={editor.saving}
          onEdit={editor.startEditing}
          onSave={() => void editor.save(messages.contentEditor)}
          onCancel={editor.cancelEditing}
        />
      )}

      <EditFeedback feedback={editor.feedback} />

      <div className="home-reviews__layout">
        <div className="home-reviews__form">
          <h3>{messages.reviews.formHeading}</h3>
          <form className="auth-form" onSubmit={onSubmit}>
            {/* The labels stay for screen readers only; the text people see is the placeholder
                inside each box. */}
            <label className="form-field">
              <span className="visually-hidden">{messages.reviews.nameLabel}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={messages.reviews.namePlaceholder}
                maxLength={60}
                required
              />
            </label>

            <div className="form-field review-form__rating">
              <StarPicker value={rating} label={messages.reviews.ratingLabel} onChange={setRating} />
            </div>

            <label className="form-field">
              <span className="visually-hidden">{messages.reviews.commentLabel}</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={messages.reviews.commentPlaceholder}
                maxLength={600}
                rows={4}
                required
              />
            </label>

            {status === 'success' && (
              <p className="auth-message" role="status">
                {messages.reviews.success}
              </p>
            )}
            {status === 'error' && (
              <p className="auth-message" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="button button--primary auth-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? messages.reviews.submitting : messages.reviews.submit}
            </button>
          </form>
        </div>

        <div className="home-reviews__entries">
          {reviews.length > 0 ? (
            <div className="review-list">
              {reviews.map((review) => (
                <div className="card review-card" key={review.id}>
                  <div className="review-card__head">
                    <Stars rating={review.rating} />
                    <span className="review-card__date">{formatReviewDate(review.createdAt, locale)}</span>
                  </div>
                  <p className="review-card__comment">{review.comment}</p>
                  <div className="review-card__footer">
                    <span className="review-card__name">{review.name}</span>
                    {canModerate && (
                      <button type="button" className="review-card__remove" onClick={() => onRemove(review.id)}>
                        {messages.reviews.remove}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="home-reviews__empty">{messages.reviews.empty}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default ReviewsSection
