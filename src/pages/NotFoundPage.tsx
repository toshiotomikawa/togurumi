import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'

function NotFoundPage() {
  const { messages } = useLocale()

  return (
    <div className="page page--narrow">
      <section className="hero">
        <span className="hero__eyebrow">{messages.notFound.eyebrow}</span>
        <h1>{messages.notFound.title}</h1>
        <p>{messages.notFound.body}</p>
        <div className="hero__actions">
          <Link to="/" className="button button--primary">
            {messages.notFound.button}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default NotFoundPage
