import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, getColorSwatch, isRecentlyReleased, parseProductColors } from '../lib/shop'
import { slugify } from '../lib/slug'
import NotFoundPage from './NotFoundPage'

function ProductImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="product-detail__image product-detail__image--placeholder" role="img" aria-label={label}>
      <span className="product-detail__placeholder-yarn" aria-hidden="true" />
      <span className="product-detail__placeholder-label">{label}</span>
    </div>
  )
}

function ProductDetailSkeleton({ label }: { label: string }) {
  return (
    <div className="page page--product" aria-busy="true" aria-live="polite" aria-label={label}>
      <div className="product-detail product-detail--skeleton" aria-hidden="true">
        <div className="product-detail__media">
          <div className="product-detail__image product-detail__skeleton-block" />
        </div>
        <div className="product-detail__info">
          <div className="product-detail__skeleton-line product-detail__skeleton-line--xs" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--title" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--price" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--md" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--lg" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--md" />
          <div className="product-detail__skeleton-cta" />
        </div>
      </div>
    </div>
  )
}

function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const { addItem } = useCart()
  const { products, loaded } = useShopProducts()
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState(slug)

  // Reset ephemeral UI when navigating between product slugs (React "adjust state while rendering").
  if (slug !== activeSlug) {
    setActiveSlug(slug)
    setAdded(false)
    setSelectedColor('')
    setFailedImageSrc(null)
  }

  if (!loaded) {
    return <ProductDetailSkeleton label={messages.shop.loadingLabel} />
  }

  const found = products.find((item) => slugify(item.name) === slug)
  if (!found) return <NotFoundPage />

  const product = found
  const availableColors = parseProductColors(product.cores)
  const activeColor = availableColors.includes(selectedColor) ? selectedColor : availableColors[0]
  const activeImage = (activeColor && product.imagesByColor[activeColor]) || product.image
  const showImage = Boolean(activeImage) && failedImageSrc !== activeImage
  const soldOut = product.stock <= 0
  const isNew = isRecentlyReleased(product.releaseDate)
  const productSlug = slugify(product.name)

  function handleAddToCart() {
    if (soldOut) return
    addItem({
      slug: productSlug,
      name: product.name,
      price: product.price,
      color: activeColor,
    })
    setAdded(true)
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setAdded(false)
  }

  function handleImageError() {
    if (activeImage) setFailedImageSrc(activeImage)
  }

  return (
    <div className="page page--product">
      <nav className="product-breadcrumb" aria-label={messages.shop.backLink}>
        <Link to="/shop" className="product-breadcrumb__link">
          {messages.shop.eyebrow}
        </Link>
        <span className="product-breadcrumb__sep" aria-hidden="true">
          /
        </span>
        <span className="product-breadcrumb__current">{product.name}</span>
      </nav>

      <Link to="/shop" className="back-link product-detail__back">
        {messages.shop.backLink}
      </Link>

      <article className={`product-detail${soldOut ? ' product-detail--sold-out' : ''}`}>
        <div className="product-detail__media">
          {showImage ? (
            <img
              className="product-detail__image"
              src={activeImage}
              alt={product.name}
              onError={handleImageError}
            />
          ) : (
            <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
          )}
          {soldOut ? (
            <span className="product-detail__sold-out-badge">{messages.shop.outOfStock}</span>
          ) : null}
        </div>

        <div className="product-detail__info">
          <div className="product-detail__tags">
            {product.category ? (
              <Link
                to={`/search?category=${encodeURIComponent(product.category)}`}
                className="product-detail__category"
              >
                {product.category}
              </Link>
            ) : null}
            {isNew ? <span className="product-detail__badge">{messages.shop.newBadge}</span> : null}
          </div>

          {product.designer ? (
            <p className="product-detail__designer">
              {messages.shop.designerLabel}: {product.designer}
            </p>
          ) : null}

          <h1 className="product-detail__title">{product.name}</h1>

          <div className="product-detail__pricing">
            <span className="product-detail__price">{formatPrice(product.price, locale)}</span>
            <span className={`product-detail__stock-chip${soldOut ? ' product-detail__stock-chip--out' : ''}`}>
              {soldOut ? messages.shop.outOfStock : `${messages.shop.stockLabel}: ${product.stock}`}
            </span>
          </div>

          {product.description ? <p className="product-detail__description">{product.description}</p> : null}

          {(product.yarn || product.designer || (product.cores && availableColors.length === 0)) && (
            <dl className="product-detail__specs">
              {product.yarn ? (
                <div className="product-detail__spec">
                  <dt>{messages.shop.yarnLabel}</dt>
                  <dd>{product.yarn}</dd>
                </div>
              ) : null}
              {product.cores && availableColors.length === 0 ? (
                <div className="product-detail__spec">
                  <dt>{messages.shop.coresLabel}</dt>
                  <dd>{product.cores}</dd>
                </div>
              ) : null}
              {product.designer ? (
                <div className="product-detail__spec">
                  <dt>{messages.shop.designerLabel}</dt>
                  <dd>{product.designer}</dd>
                </div>
              ) : null}
            </dl>
          )}

          {availableColors.length > 0 ? (
            <fieldset className="product-color-picker">
              <legend>{messages.shop.chooseColorLabel}</legend>
              <div className="product-color-picker__swatches">
                {availableColors.map((color) => {
                  const selected = activeColor === color
                  return (
                    <button
                      type="button"
                      className={`color-swatch${selected ? ' color-swatch--selected' : ''}`}
                      style={{ backgroundColor: getColorSwatch(color) }}
                      onClick={() => handleColorSelect(color)}
                      aria-label={`${messages.shop.chooseColorLabel}: ${color}`}
                      aria-pressed={selected}
                      title={color}
                      key={color}
                    >
                      <span className="color-swatch__check" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
              <span className="product-color-picker__selection">
                <strong>{messages.shop.selectedColorLabel}:</strong> {activeColor}
              </span>
            </fieldset>
          ) : null}

          <div className="product-detail__actions">
            <button
              type="button"
              className={`button button--primary product-detail__cta${added ? ' product-detail__cta--added' : ''}`}
              onClick={handleAddToCart}
              disabled={soldOut}
            >
              {soldOut ? messages.shop.outOfStock : added ? messages.shop.addedToCart : messages.shop.addToCart}
            </button>
            <p className="product-detail__cart-status" role="status" aria-live="polite">
              {added && !soldOut ? messages.shop.addedToCart : null}
            </p>
          </div>

          {messages.shop.deliveryNotice ? (
            <p className="product-detail__delivery">{messages.shop.deliveryNotice}</p>
          ) : null}
        </div>
      </article>
    </div>
  )
}

export default ProductPage
