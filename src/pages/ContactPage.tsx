import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_INSTAGRAM } from '../lib/togurumi'

function ContactPage() {
  const { messages } = useLocale()

  return (
    <div className="page page--narrow">
      <section className="hero">
        <span className="hero__eyebrow">{messages.contact.eyebrow}</span>
        <h1>{messages.contact.title}</h1>
        <p>{messages.contact.intro}</p>
      </section>

      <div className="contact-list">
        <div className="card">
          <h3>{messages.contact.instagram}</h3>
          <p>
            <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer">
              @togurumi
            </a>
          </p>
        </div>
        <div className="card">
          <h3>{messages.contact.commissions}</h3>
          <p>{messages.contact.commissionsBody}</p>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
