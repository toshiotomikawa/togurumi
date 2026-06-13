import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_EMAIL, TOGURUMI_INSTAGRAM } from '../lib/togurumi'

function ContactPage() {
  const { messages } = useLocale()

  return (
    <div className="page page--narrow">
      <section className="hero">
        <span className="hero__eyebrow">{messages.about.eyebrow}</span>
        <h1>{messages.about.title}</h1>
        <p>{messages.about.intro}</p>
      </section>

      <section className="section">
        <h2>{messages.about.whyHeading}</h2>
        <p>{messages.about.whyBody}</p>
      </section>

      <section className="section">
        <h2>{messages.about.nameHeading}</h2>
        <p>{messages.about.nameBody}</p>
      </section>

      <section className="section">
        <h2>{messages.contact.title}</h2>
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
          <h3>{messages.contact.email}</h3>
          <p>
            <a href={`mailto:${TOGURUMI_EMAIL}`}>{TOGURUMI_EMAIL}</a>
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
