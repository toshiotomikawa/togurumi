import { useState } from 'react'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ProductCard from '../components/ProductCard'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { TOGURUMI_INSTAGRAM_DM } from '../lib/togurumi'

function ShopPage() {
  const { messages, locale } = useLocale()
  const { products } = useShopProducts()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const editor = useEditableContent('shop', locale, messages.shop, messages.contentEditor.draftRestored)

  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)))
  const visibleProducts = activeCategory
    ? products.filter((product) => product.category === activeCategory)
    : products

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
          </div>
        </section>
      ) : (
        <section className="hero">
          <span className="hero__eyebrow">{editor.content.eyebrow}</span>
          <h1>{editor.content.title}</h1>
          <p>{editor.content.intro}</p>
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

      <section className="section">
        <div className="section__head">
          <h2>{messages.shop.availableHeading}</h2>
        </div>
        <p className="shop-delivery-note">{messages.shop.deliveryNotice}</p>
        {products.length > 0 ? (
          <>
            {categories.length > 1 && (
              <div className="tag-filter">
                <button
                  type="button"
                  className={`tag-filter__item${activeCategory === null ? ' tag-filter__item--active' : ''}`}
                  onClick={() => setActiveCategory(null)}
                >
                  {messages.shop.allCategories}
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`tag-filter__item${activeCategory === category ? ' tag-filter__item--active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
            <div className="card-grid">
              {visibleProducts.map((product) => (
                <ProductCard product={product} key={product.name} />
              ))}
            </div>
          </>
        ) : (
          <p>{messages.shop.availableEmpty}</p>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>{messages.shop.patternsHeading}</h2>
        </div>
        <p>{messages.shop.patternsIntro}</p>
        <div className="card-grid">
          {messages.shop.patternsItems.map((pattern) =>
            pattern.action === 'commission' ? (
              <a
                className="card pattern-card pattern-card--link"
                href={TOGURUMI_INSTAGRAM_DM}
                target="_blank"
                rel="noopener noreferrer"
                key={pattern.name}
              >
                <span className="pattern-card__status">{pattern.status}</span>
                <h3>{pattern.name}</h3>
                <p>{pattern.description}</p>
                <span className="pattern-card__cta">{messages.shop.commissionCta}</span>
              </a>
            ) : (
              <div className="card pattern-card" key={pattern.name}>
                <span className="pattern-card__status">{pattern.status}</span>
                <h3>{pattern.name}</h3>
                <p>{pattern.description}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export default ShopPage
