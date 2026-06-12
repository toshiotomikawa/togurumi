import { useLocale } from '../hooks/useLocale'
import { getPrivacyContent } from '../i18n/privacy'

function PrivacyPolicyPage() {
  const { locale } = useLocale()
  const privacy = getPrivacyContent(locale)

  return (
    <div className="page page--narrow">
      <section className="hero hero--legal">
        <h1>{privacy.title}</h1>
        <p className="legal-meta">{privacy.lastUpdated}</p>
        <p>{privacy.intro}</p>
      </section>

      <div className="legal-body">
        {privacy.sections.map((section) => (
          <section key={section.id} className="section">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
