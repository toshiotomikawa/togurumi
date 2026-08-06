import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { formatPrice, isRecentlyReleased, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'

function ProductImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="product-card__image product-card__image--placeholder" role="img" aria-label={label}>
      <span className="product-card__placeholder-yarn" aria-hidden="true" />
      <span className="product-card__placeholder-label">{label}</span>
    </div>
  )
}

function ProductCard({ product }: { product: ShopProduct }) {
  const { messages, locale } = useLocale()
  const [imageFailed, setImageFailed] = useState(false)
  const slug = slugify(product.name)
  const productHref = `/shop/${slug}`
  const showImage = Boolean(product.image) && !imageFailed
  const soldOut = product.stock <= 0
  const isNew = isRecentlyReleased(product.releaseDate)

  return (
    <article className={`card product-card${soldOut ? ' product-card--sold-out' : ''}`}>
      <Link to={productHref} className="product-card__media-link" tabIndex={-1} aria-hidden="true">
        {showImage ? (
          <img
            className="product-card__image"
            src={product.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
        )}
      </Link>

      <div className="product-card__body">
        <div className="product-card__tags">
          {product.category ? (
            <Link
              to={`/search?category=${encodeURIComponent(product.category)}`}
              className="product-card__category"
            >
              {product.category}
            </Link>
          ) : (
            <span className="product-card__category product-card__category--static" aria-hidden="true" />
          )}
          {isNew && <span className="product-card__badge">{messages.shop.newBadge}</span>}
        </div>

        <h3 className="product-card__title">
          <Link to={productHref}>{product.name}</Link>
        </h3>

        {product.cores ? <p className="product-card__cores">{product.cores}</p> : null}
        {product.designer ? (
          <p className="product-card__designer">
            {messages.shop.designerLabel}: {product.designer}
          </p>
        ) : null}
        {product.description ? <p className="product-card__description">{product.description}</p> : null}

        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(product.price, locale)}</span>
          <span className={`product-card__stock${soldOut ? ' product-card__stock--out' : ''}`}>
            {soldOut ? messages.shop.outOfStock : `${messages.shop.stockLabel}: ${product.stock}`}
          </span>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__image product-card__skeleton-block" />
      <div className="product-card__body">
        <div className="product-card__skeleton-line product-card__skeleton-line--sm" />
        <div className="product-card__skeleton-line product-card__skeleton-line--lg" />
        <div className="product-card__skeleton-line product-card__skeleton-line--md" />
        <div className="product-card__footer">
          <div className="product-card__skeleton-line product-card__skeleton-line--price" />
          <div className="product-card__skeleton-line product-card__skeleton-line--sm" />
        </div>
      </div>
    </div>
  )
}

export function ProductComingSoonCard() {
  const { messages } = useLocale()

  return (
    <div className="card product-card product-card--coming-soon">
      <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
      <div className="product-card__body">
        <h3>{messages.shop.comingSoonTitle}</h3>
        <p>{messages.shop.comingSoonBody}</p>
      </div>
    </div>
  )
}

export default ProductCard
