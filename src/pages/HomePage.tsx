import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ProductCard, { ProductCardSkeleton, ProductComingSoonCard } from '../components/ProductCard'
import ReviewsSection from '../components/ReviewsSection'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useJournalPosts } from '../hooks/useJournal'
import { useShopProducts } from '../hooks/useShopProducts'
import type { SupportedLocale } from '../lib/i18n'
import { formatPrice, isRecentlyReleased, type ShopProduct } from '../lib/shop'
import {
  TOGURUMI_INSTAGRAM_DM,
  TOGURUMI_LATEST_VIDEO,
  TOGURUMI_YOUTUBE,
} from '../lib/togurumi'

const STORE_SKELETON_COUNT = 6

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function HeroFeaturedMedia({
  product,
  locale,
  newBadge,
  photoComingSoon,
}: {
  product: ShopProduct
  locale: SupportedLocale
  newBadge: string
  photoComingSoon: string
}) {
  // Track the failed URL so a catalog refresh with a new image can retry without loops.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = product.image ?? ''
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl
  const isNew = isRecentlyReleased(product.releaseDate)

  return (
    <div className="hero__media">
      {showImage ? (
        <img
          src={imageUrl}
          alt={product.name}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div className="hero__media-placeholder" role="img" aria-label={photoComingSoon}>
          <span className="hero__media-placeholder-yarn" aria-hidden="true" />
          <span className="hero__media-placeholder-label">{photoComingSoon}</span>
        </div>
      )}
      <div className="hero__media-tag">
        {isNew ? <span className="hero__media-eyebrow">{newBadge}</span> : null}
        <span className="hero__media-name">{product.name}</span>
        <span className="hero__media-price">{formatPrice(product.price, locale)}</span>
      </div>
    </div>
  )
}

function HomePage() {
  const { messages, locale } = useLocale()
  const { posts: journalPosts, error: journalError } = useJournalPosts(locale)
  const latest = journalPosts[0]
  const { products, loaded } = useShopProducts()
  const editor = useEditableContent('home', locale, messages.home, messages.contentEditor.draftRestored)

  const highlights = products.filter((product) => product.highlight)
  const comingSoonSlots = products.length > 0 ? (3 - (products.length % 3)) % 3 : 0
  const featuredProduct = highlights[0] ?? products[0]
  const showHeroMediaSlot = !loaded || Boolean(featuredProduct)
  const latestHasIsoDate = latest ? isIsoDate(latest.date) : false

  return (
    <div className="page page--home">
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
              label={messages.contentEditor.fields.storeHeading}
              value={editor.draft.storeHeading}
              onChange={(value) => editor.updateField('storeHeading', value)}
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
            <EditField
              label={messages.contentEditor.fields.youtubeHeading}
              value={editor.draft.youtubeHeading}
              onChange={(value) => editor.updateField('youtubeHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeIntro}
              value={editor.draft.youtubeIntro}
              multiline
              onChange={(value) => editor.updateField('youtubeIntro', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeVideoCta}
              value={editor.draft.youtubeVideoCta}
              onChange={(value) => editor.updateField('youtubeVideoCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeChannelCta}
              value={editor.draft.youtubeChannelCta}
              onChange={(value) => editor.updateField('youtubeChannelCta', value)}
            />
          </div>
        </section>
      ) : (
        <section className={`hero${showHeroMediaSlot ? ' hero--split' : ''}`}>
          <div className="hero__copy">
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
          </div>
          {!loaded ? (
            <div className="hero__media hero__media--skeleton" aria-hidden="true">
              <div className="hero__media-skeleton-block" />
            </div>
          ) : featuredProduct ? (
            <HeroFeaturedMedia
              product={featuredProduct}
              locale={locale}
              newBadge={messages.shop.newBadge}
              photoComingSoon={messages.shop.photoComingSoon}
            />
          ) : null}
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

      {loaded && highlights.length > 0 ? (
        <section className="section home-highlights">
          <div className="section__head">
            <h2>{editor.content.highlightsHeading}</h2>
            <Link to="/shop">{editor.content.viewAll}</Link>
          </div>
          <div className="card-grid card-grid--products">
            {highlights.map((product) => (
              <ProductCard product={product} key={product.name} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section home-store">
        <div className="section__head">
          <h2>{editor.content.storeHeading}</h2>
          <Link to="/shop">{editor.content.viewAll}</Link>
        </div>
        {!loaded ? (
          <div
            className="card-grid card-grid--products"
            aria-busy="true"
            aria-live="polite"
            aria-label={messages.shop.loadingLabel}
          >
            {Array.from({ length: STORE_SKELETON_COUNT }, (_, index) => (
              <ProductCardSkeleton key={`home-store-skeleton-${index}`} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="card-grid card-grid--products">
            {products.map((product) => (
              <ProductCard product={product} key={product.name} />
            ))}
            {Array.from({ length: comingSoonSlots }, (_, index) => (
              <ProductComingSoonCard key={`coming-soon-${index}`} />
            ))}
          </div>
        ) : (
          <div className="shop-empty home-store-empty">
            <p className="shop-empty__title">{messages.shop.emptyTitle}</p>
            <p className="shop-empty__body">{messages.shop.availableEmpty}</p>
            <div className="home-store-empty__actions">
              <Link to="/shop" className="button button--primary">
                {editor.content.shopCta}
              </Link>
              <a
                href={TOGURUMI_INSTAGRAM_DM}
                className="button"
                target="_blank"
                rel="noopener noreferrer"
              >
                {messages.shop.commissionCta}
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="section youtube-feature">
        <div className="youtube-feature__mark" aria-hidden="true">
          <span />
        </div>
        <div className="youtube-feature__content">
          <h2>{editor.content.youtubeHeading}</h2>
          <p>{editor.content.youtubeIntro}</p>
          <div className="youtube-feature__actions">
            <a
              href={TOGURUMI_LATEST_VIDEO}
              className="button button--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {editor.content.youtubeVideoCta}
            </a>
            <a
              href={TOGURUMI_YOUTUBE}
              className="button button--youtube"
              target="_blank"
              rel="noopener noreferrer"
            >
              {editor.content.youtubeChannelCta}
            </a>
          </div>
        </div>
      </section>

      {journalError ? (
        <section className="section home-journal-preview">
          <p className="editor-feedback editor-feedback--error" role="alert">
            {messages.auth.genericError}
          </p>
        </section>
      ) : latest ? (
        <section className="section home-journal-preview">
          <div className="section__head">
            <h2>{editor.content.journalHeading}</h2>
            <Link to="/journal">{editor.content.allEntries}</Link>
          </div>
          <Link to={`/journal/${latest.slug}`} className="home-journal-card">
            <div className="home-journal-card__body">
              <h3 className="home-journal-card__title">{latest.title}</h3>
              <p className="home-journal-card__meta">
                {latestHasIsoDate ? (
                  <time dateTime={latest.date}>{latest.date}</time>
                ) : (
                  <span>{latest.date}</span>
                )}
              </p>
              {latest.summary ? <p className="home-journal-card__summary">{latest.summary}</p> : null}
              <span className="home-journal-card__cta">{editor.content.allEntries}</span>
            </div>
          </Link>
        </section>
      ) : null}

      <ReviewsSection />
    </div>
  )
}

export default HomePage
