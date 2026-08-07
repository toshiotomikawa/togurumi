import { useLocale } from '../hooks/useLocale'
import { getPrivacyContent } from '../i18n/privacy'

function PrivacyPolicyPage() {
  const { locale, messages } = useLocale()
  const privacy = getPrivacyContent(locale)

  return (
    <div className="page page--legal">
      <header className="legal-hero">
        <span className="legal-hero__eyebrow">{messages.legal.eyebrow}</span>
        <h1 className="legal-hero__title">{privacy.title}</h1>
        <p className="legal-hero__meta">{privacy.lastUpdated}</p>
        <p className="legal-hero__intro">{privacy.intro}</p>
      </header>

      <div className="legal-layout">
        <nav className="legal-toc" aria-label={messages.legal.tocLabel}>
          <h2 className="legal-toc__title">{messages.legal.tocTitle}</h2>
          <ol className="legal-toc__list">
            {privacy.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-body">
          {privacy.sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-section" tabIndex={-1}>
              <h2 className="legal-section__title">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
