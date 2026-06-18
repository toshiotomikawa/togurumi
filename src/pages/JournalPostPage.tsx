import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { getJournalPost } from '../lib/journal'
import NotFoundPage from './NotFoundPage'

function JournalPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const post = slug ? getJournalPost(slug, locale) : undefined

  if (!post) return <NotFoundPage />

  return (
    <div className="page page--narrow">
      <Link to="/journal" className="back-link">
        {messages.journal.backLink}
      </Link>
      <article>
        <h1>{post.title}</h1>
        <p className="journal-post__meta">
          {post.date}
          {' · '}
          <Link to={`/journal?author=${encodeURIComponent(post.author)}`} className="journal-post__author">
            {messages.journal.byAuthor.replace('{{author}}', post.author)}
          </Link>
        </p>
        <div className="journal-post__body">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}

export default JournalPostPage
