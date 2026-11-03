import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EditActions, EditFeedback, EditField, Paragraphs } from '../components/EditableContent'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorCode, useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useJournalPosts } from '../hooks/useJournal'
import type { JournalPost } from '../lib/journal'

function fillAuthor(template: string, author: string) {
  return template.replaceAll('{{author}}', author)
}

function JournalPage() {
  const { messages, locale } = useLocale()
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const author = searchParams.get('author')
  const canManage = user?.role === 'admin' || user?.role === 'moderator'
  const { posts, loaded, error, reload } = useJournalPosts(locale, author ?? undefined, canManage, user?.id)
  const editor = useEditableContent('journal', locale, messages.journal, messages.contentEditor.draftRestored)
  const [archiveFeedback, setArchiveFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [archivingSlug, setArchivingSlug] = useState<string | null>(null)

  function clearAuthor() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('author')
      return next
    })
  }

  async function toggleArchived(post: JournalPost) {
    setArchiveFeedback(null)
    setArchivingSlug(post.slug)

    try {
      const response = await fetch(`/api/journal/${post.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ archived: !post.archived }),
      })

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) throw new Error('archive_failed')

      await reload()
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setArchiveFeedback({ kind: 'error', text: messages.auth.genericError })
      }
    } finally {
      setArchivingSlug(null)
    }
  }

  const hasAuthorFilter = Boolean(author)

  return (
    <div className={`page page--journal${editor.pendingClass}`}>
      {editor.editing && editor.draft ? (
        <section className="journal-hero journal-hero--editing">
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
        </section>
      ) : (
        <section className="journal-hero">
          <span className="journal-hero__eyebrow editable-text">{editor.content.eyebrow}</span>
          <h1 className="journal-hero__title editable-text">{editor.content.title}</h1>
          <div className="journal-hero__intro editable-text">
            <Paragraphs text={editor.content.intro} />
          </div>
        </section>
      )}

      {canManage && !editor.editing ? (
        <div className="journal-manage" role="group" aria-label={messages.journal.manageLabel}>
          <Link to={`/admin/journal?new=1&locale=${locale}`} className="button button--primary">
            {messages.auth.newPost}
          </Link>
          <button type="button" className="button" onClick={editor.startEditing}>
            {messages.contentEditor.editButton}
          </button>
        </div>
      ) : null}

      {editor.canEdit && editor.editing ? (
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
      ) : null}

      <EditFeedback feedback={editor.feedback} />

      {hasAuthorFilter && author ? (
        <div className="journal-author-filter" role="group" aria-label={messages.journal.authorFilterLabel}>
          <span className="journal-author-filter__pill">
            <span className="journal-author-filter__label">{messages.journal.authorFilterLabel}</span>
            <span className="journal-author-filter__value">{author}</span>
          </span>
          <button type="button" className="journal-author-filter__clear" onClick={clearAuthor}>
            {messages.journal.clearAuthor}
          </button>
        </div>
      ) : null}

      <EditFeedback feedback={archiveFeedback} />

      {!loaded ? (
        <div className="auth-route-loading" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
        </div>
      ) : error ? (
        <p className="editor-feedback editor-feedback--error" role="alert">
          {messages.auth.genericError}
        </p>
      ) : posts.length > 0 ? (
        <ul className="journal-list" aria-label={messages.journal.listLabel}>
          {posts.map((post) => (
            <li
              key={post.slug}
              className={`journal-card${post.archived ? ' journal-card--archived' : ''}`}
            >
              <article>
                <Link to={`/journal/${post.slug}`} className="journal-card__link">
                  <h2 className="journal-card__title">{post.title}</h2>
                  <p className="journal-card__meta">
                    {/^\d{4}-\d{2}-\d{2}$/.test(post.date) ? (
                      <time dateTime={post.date}>{post.date}</time>
                    ) : (
                      <span>{post.date}</span>
                    )}
                    {post.archived ? (
                      <span className="journal-card__badge">{messages.auth.archivedBadge}</span>
                    ) : null}
                  </p>
                  {post.summary ? <p className="journal-card__summary">{post.summary}</p> : null}
                </Link>
                {canManage ? (
                  <div className="journal-card__actions" role="group" aria-label={messages.journal.cardActionsLabel}>
                    <Link
                      to={`/admin/journal?edit=${encodeURIComponent(post.id)}`}
                      className="button journal-card__action"
                    >
                      {messages.auth.editPost}
                    </Link>
                    <button
                      type="button"
                      className="button journal-card__action"
                      disabled={archivingSlug === post.slug}
                      onClick={() => void toggleArchived(post)}
                    >
                      {post.archived ? messages.auth.unarchivePost : messages.auth.archivePost}
                    </button>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <section
          className="journal-empty"
          aria-labelledby={hasAuthorFilter ? 'journal-empty-author-title' : 'journal-empty-title'}
        >
          <span className="journal-empty__deco" aria-hidden="true" />
          {hasAuthorFilter && author ? (
            <>
              <h2 id="journal-empty-author-title" className="journal-empty__title">
                {fillAuthor(messages.journal.emptyAuthorTitle, author)}
              </h2>
              <p className="journal-empty__body">
                {fillAuthor(messages.journal.emptyAuthorBody, author)}
              </p>
              <button type="button" className="button button--primary" onClick={clearAuthor}>
                {messages.journal.clearAuthor}
              </button>
            </>
          ) : (
            <>
              <h2 id="journal-empty-title" className="journal-empty__title">
                {messages.journal.emptyTitle}
              </h2>
              <p className="journal-empty__body">{messages.journal.emptyBody}</p>
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default JournalPage
