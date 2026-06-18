import { Link } from 'react-router-dom'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ProductCard from '../components/ProductCard'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { getJournalPosts } from '../lib/journal'

function HomePage() {
  const { messages, locale } = useLocale()
  const latest = getJournalPosts(locale)[0]
  const { products } = useShopProducts()
  const editor = useEditableContent('home', locale, messages.home, messages.contentEditor.draftRestored)

  const highlights = products.filter((product) => product.highlight)

  return (
    <div className="page">
      {editor.editing && editor.draft ? (
        <section className="hero">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.eyebrow}
              value={editor.draft.eyebrow}
              onChange={(value) => editor.updateField('eyebrow', value)}
            />
            <EditField
              label={messages.contentEditor.fields.title}
              value={editor.draft.title}
              onChange={(value) => editor.updateField('title', value)}
            />
            <EditField
              label={messages.contentEditor.fields.intro}
              value={editor.draft.intro}
              multiline
              onChange={(value) => editor.updateField('intro', value)}
            />
            <EditField
              label={messages.contentEditor.fields.shopCta}
              value={editor.draft.shopCta}
              onChange={(value) => editor.updateField('shopCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.journalCta}
              value={editor.draft.journalCta}
              onChange={(value) => editor.updateField('journalCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.highlightsHeading}
              value={editor.draft.highlightsHeading}
              onChange={(value) => editor.updateField('highlightsHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.recentHeading}
              value={editor.draft.recentHeading}
              onChange={(value) => editor.updateField('recentHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.viewAll}
              value={editor.draft.viewAll}
              onChange={(value) => editor.updateField('viewAll', value)}
            />
            <EditField
              label={messages.contentEditor.fields.journalHeading}
              value={editor.draft.journalHeading}
              onChange={(value) => editor.updateField('journalHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.allEntries}
              value={editor.draft.allEntries}
              onChange={(value) => editor.updateField('allEntries', value)}
            />
          </div>
        </section>
      ) : (
        <section className="hero">
          <span aria-hidden="true" className="hero__yarn-ball" />
          <span className="hero__eyebrow hero__eyebrow--katakana">{editor.content.eyebrow}</span>
          <h1>{editor.content.title}</h1>
          <p>{editor.content.intro}</p>
          <div className="hero__actions">
            <Link to="/shop" className="button button--primary">
              {editor.content.shopCta}
            </Link>
            <Link to="/journal" className="button">
              {editor.content.journalCta}
            </Link>
          </div>
        </section>
      )}

      {editor.canEdit && (
        <EditActions
          editLabel={messages.contentEditor.editButton}
          saveLabel={messages.contentEditor.save}
          cancelLabel={messages.contentEditor.cancel}
          editing={editor.editing}
          saving={editor.saving}
          onEdit={editor.startEditing}
          onSave={() => void editor.save(messages.contentEditor)}
          onCancel={editor.cancelEditing}
        />
      )}

      <EditFeedback feedback={editor.feedback} />

      {highlights.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>{editor.content.highlightsHeading}</h2>
            <Link to="/shop">{editor.content.viewAll}</Link>
          </div>
          <div className="card-grid">
            {highlights.map((product) => (
              <ProductCard product={product} key={product.name} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>{editor.content.recentHeading}</h2>
          <Link to="/shop">{editor.content.viewAll}</Link>
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
            <h2>{editor.content.journalHeading}</h2>
            <Link to="/journal">{editor.content.allEntries}</Link>
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
