import { useState } from 'react'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { TOGURUMI_INSTAGRAM_DM } from '../lib/togurumi'

const SKELETON_COUNT = 6

function ShopPage() {
  const { messages, locale } = useLocale()
  const { products, loaded } = useShopProducts()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const editor = useEditableContent('shop', locale, messages.shop, messages.contentEditor.draftRestored)

  const cover = products.find((product) => product.image && product.stock > 0)

  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)))
  const visibleProducts = activeCategory
    ? products.filter((product) => product.category === activeCategory)
    : products

  return (
    <div className="page page--shop">
      {editor.editing && editor.draft ? (
        <section className="shop-hero">
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
        <section className="shop-hero shop-hero--photographic">
          <div className="shop-hero__copy">
            <span className="shop-hero__eyebrow">{editor.content.eyebrow}</span>
            <h1 className="shop-hero__title">{editor.content.title}</h1>
            <p className="shop-hero__intro">{editor.content.intro}</p>
          </div>
          {cover && <img className="shop-hero__photo" src={cover.image} alt={cover.name} />}
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

      <section className="section shop-catalog">
        <div className="section__head">
          <h2>{messages.shop.availableHeading}</h2>
        </div>
        <p className="shop-delivery-note">{messages.shop.deliveryNotice}</p>

        {!loaded ? (
          <div
            className="card-grid card-grid--products"
            aria-busy="true"
            aria-live="polite"
            aria-label={messages.shop.loadingLabel}
          >
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <ProductCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            {categories.length > 1 && (
              <div className="tag-filter" role="group" aria-label={messages.shop.availableHeading}>
                <button
                  type="button"
                  className={`tag-filter__item${activeCategory === null ? ' tag-filter__item--active' : ''}`}
                  aria-pressed={activeCategory === null}
                  onClick={() => setActiveCategory(null)}
                >
                  {messages.shop.allCategories}
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={`tag-filter__item${activeCategory === category ? ' tag-filter__item--active' : ''}`}
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {visibleProducts.length > 0 ? (
              <div className="card-grid card-grid--products">
                {visibleProducts.map((product) => (
                  <ProductCard product={product} key={product.name} />
                ))}
              </div>
            ) : (
              <div className="shop-empty">
                <p className="shop-empty__title">{messages.shop.filterEmptyTitle}</p>
                <p className="shop-empty__body">{messages.shop.filterEmptyBody}</p>
                <button type="button" className="button" onClick={() => setActiveCategory(null)}>
                  {messages.shop.allCategories}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="shop-empty">
            <p className="shop-empty__title">{messages.shop.emptyTitle}</p>
            <p className="shop-empty__body">{messages.shop.availableEmpty}</p>
          </div>
        )}
      </section>

      <section className="section shop-patterns">
        <div className="section__head">
          <h2>{messages.shop.patternsHeading}</h2>
        </div>
        <p className="shop-patterns__intro">{messages.shop.patternsIntro}</p>
        <div className="card-grid card-grid--patterns">
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
