import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorCode, useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { getJournalPosts, type JournalPost } from '../lib/journal'

function JournalPage() {
  const { messages, locale } = useLocale()
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const author = searchParams.get('author')
  const canManage = user?.role === 'admin' || user?.role === 'moderator'
  const posts = getJournalPosts(locale, author ?? undefined, canManage)
  const editor = useEditableContent('journal', locale, messages.journal, messages.contentEditor.draftRestored)
  const [archiveFeedback, setArchiveFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
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

      window.location.reload()
    } catch (error) {
      if (getApiErrorCode(error) !== 'unauthorized') {
        setArchiveFeedback({ kind: 'error', text: messages.auth.genericError })
      }
      setArchivingSlug(null)
    }
  }

  return (
    <div className="page page--narrow">
      {editor.editing && editor.draft ? (
        <section className="hero">
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
        <section className="hero">
          <span className="hero__eyebrow">{editor.content.eyebrow}</span>
          <h1>{editor.content.title}</h1>
          <p>{editor.content.intro}</p>
        </section>
      )}

      {canManage && !editor.editing && (
        <div className="journal-manage__actions">
          <Link to={`/admin/journal?new=1&locale=${locale}`} className="button button--primary">
            {messages.auth.newPost}
          </Link>
          <button type="button" className="button" onClick={editor.startEditing}>
            {messages.contentEditor.editButton}
          </button>
        </div>
      )}

      {editor.canEdit && editor.editing && (
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

      {author && (
        <div className="tag-filter">
          <span className="tag-filter__active">
            {messages.journal.byAuthor.replace('{{author}}', author)}
          </span>
          <button type="button" className="tag-filter__item" onClick={clearAuthor}>
            {messages.search.clearFilter}
          </button>
        </div>
      )}

      <EditFeedback feedback={archiveFeedback} />

      <div className="journal-list">
        {posts.map((post) => (
          <div className="journal-card" key={post.slug}>
            <Link to={`/journal/${post.slug}`} className="journal-card__link">
              <h3>{post.title}</h3>
              <p className="journal-card__meta">
                {post.date}
                {post.archived ? <span className="locale-badge">{messages.auth.archivedBadge}</span> : null}
              </p>
              <p>{post.summary}</p>
            </Link>
            {canManage && (
              <div className="journal-card__actions">
                <Link to={`/admin/journal?edit=${encodeURIComponent(post.id)}`} className="button">
                  {messages.auth.editPost}
                </Link>
                <button
                  type="button"
                  className="button"
                  disabled={archivingSlug === post.slug}
                  onClick={() => void toggleArchived(post)}
                >
                  {post.archived ? messages.auth.unarchivePost : messages.auth.archivePost}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default JournalPage
