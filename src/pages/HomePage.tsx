import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { getJournalPosts } from '../lib/journal'

function HomePage() {
  const { messages, locale } = useLocale()
  const latest = getJournalPosts(locale)[0]

  return (
    <div className="page">
      <section className="hero">
        <span aria-hidden="true" className="hero__yarn-ball" />
        <span className="hero__eyebrow hero__eyebrow--katakana">{messages.home.eyebrow}</span>
        <h1>{messages.home.title}</h1>
        <p>{messages.home.intro}</p>
        <div className="hero__actions">
          <Link to="/shop" className="button button--primary">
            {messages.home.shopCta}
          </Link>
          <Link to="/journal" className="button">
            {messages.home.journalCta}
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>{messages.home.recentHeading}</h2>
          <Link to="/shop">{messages.home.viewAll}</Link>
        </div>
        <div className="gallery-grid">
          {messages.home.featured.map((item) => (
            <div className="gallery-item" key={item.name}>
              <span className="gallery-item__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="gallery-item__name">{item.name}</span>
              <span className="gallery-item__tag">{item.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {latest ? (
        <section className="section">
          <div className="section__head">
            <h2>{messages.home.journalHeading}</h2>
            <Link to="/journal">{messages.home.allEntries}</Link>
          </div>
          <div className="journal-list">
            <Link to={`/journal/${latest.slug}`} className="journal-card">
              <h3>{latest.title}</h3>
              <p className="journal-card__meta">{latest.date}</p>
              <p>{latest.summary}</p>
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default HomePage
