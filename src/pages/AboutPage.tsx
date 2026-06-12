import { useLocale } from '../hooks/useLocale'

function AboutPage() {
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
    </div>
  )
}

export default AboutPage
