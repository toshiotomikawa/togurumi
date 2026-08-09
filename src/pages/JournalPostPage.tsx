import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useJournalPost } from '../hooks/useJournal'
import { useLocale } from '../hooks/useLocale'
import NotFoundPage from './NotFoundPage'

function fillAuthor(template: string, author: string) {
  return template.replaceAll('{{author}}', author)
}

function JournalPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'moderator'
  const { post, loaded, error } = useJournalPost(slug, locale, canManage, user?.id)

  if (!loaded) {
    return (
      <div className="page auth-route-loading" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page page--journal-post">
        <p className="editor-feedback editor-feedback--error" role="alert">
          {messages.auth.genericError}
        </p>
      </div>
    )
  }

  if (!post) return <NotFoundPage />

  const hasIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(post.date)

  return (
    <div className="page page--journal-post">
      <nav className="journal-post-nav" aria-label={messages.journal.backLink}>
        <Link to="/journal" className="journal-post-nav__back">
          {messages.journal.backLink}
        </Link>
      </nav>

      <article className="journal-article">
        <header className="journal-article__header">
          <h1 className="journal-article__title">{post.title}</h1>
          <p className="journal-article__meta">
            {hasIsoDate ? <time dateTime={post.date}>{post.date}</time> : <span>{post.date}</span>}
            <span className="journal-article__meta-sep" aria-hidden="true">
              ·
            </span>
            <Link
              to={`/journal?author=${encodeURIComponent(post.author)}`}
              className="journal-article__author"
            >
              {fillAuthor(messages.journal.byAuthor, post.author)}
            </Link>
          </p>
        </header>

        <div className="journal-article__body journal-post__body">
          <ReactMarkdown>{post.body ?? ''}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}

export default JournalPostPage
