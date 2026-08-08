import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'

function NotFoundPage() {
  const { messages } = useLocale()

  return (
    <div className="page page--notfound">
      <section className="notfound">
        <span className="notfound__ornament" aria-hidden="true">
          <span className="notfound__ring" />
          <span className="notfound__ring notfound__ring--two" />
          <span className="notfound__thread" />
        </span>

        <span className="notfound__eyebrow">{messages.notFound.eyebrow}</span>
        <h1 className="notfound__title">{messages.notFound.title}</h1>
        <p className="notfound__body">{messages.notFound.body}</p>

        <div className="notfound__actions">
          <Link to="/" className="button button--primary">
            {messages.notFound.button}
          </Link>
          <Link to="/shop" className="button">
            {messages.notFound.shopButton}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default NotFoundPage
