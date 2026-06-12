import { useLocale } from '../hooks/useLocale'

function PatternsPage() {
  const { messages } = useLocale()

  return (
    <div className="page">
      <section className="hero">
        <span className="hero__eyebrow">{messages.patterns.eyebrow}</span>
        <h1>{messages.patterns.title}</h1>
        <p>{messages.patterns.intro}</p>
      </section>

      <div className="card-grid">
        {messages.patterns.items.map((pattern) => (
          <div className="card pattern-card" key={pattern.name}>
            <span className="pattern-card__status">{pattern.status}</span>
            <h3>{pattern.name}</h3>
            <p>{pattern.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PatternsPage
