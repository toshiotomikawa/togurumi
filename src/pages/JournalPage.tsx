import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { getJournalPosts } from '../lib/journal'

function JournalPage() {
  const { messages, locale } = useLocale()
  const posts = getJournalPosts(locale)

  return (
    <div className="page page--narrow">
      <section className="hero">
        <span className="hero__eyebrow">{messages.journal.eyebrow}</span>
        <h1>{messages.journal.title}</h1>
        <p>{messages.journal.intro}</p>
      </section>

      <div className="journal-list">
        {posts.map((post) => (
          <Link to={`/journal/${post.slug}`} className="journal-card" key={post.slug}>
            <h3>{post.title}</h3>
            <p className="journal-card__meta">{post.date}</p>
            <p>{post.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default JournalPage
