import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { formatPrice, isRecentlyReleased, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'

function ProductImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="product-card__image product-card__image--placeholder">
      <span className="product-card__placeholder-yarn" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function ProductCard({ product }: { product: ShopProduct }) {
  const { messages, locale } = useLocale()
  const navigate = useNavigate()

  function handleCategoryClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    navigate(`/search?category=${encodeURIComponent(product.category)}`)
  }

  return (
    <Link to={`/shop/${slugify(product.name)}`} className="card product-card">
      {product.image ? (
        <img className="product-card__image" src={product.image} alt={product.name} />
      ) : (
        <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
      )}
      <div className="product-card__tags">
        <button type="button" className="product-card__category" onClick={handleCategoryClick}>
          {product.category}
        </button>
        {isRecentlyReleased(product.releaseDate) && (
          <span className="product-card__badge">{messages.shop.newBadge}</span>
        )}
      </div>
      <h3>{product.name}</h3>
      {product.cores && <p className="product-card__cores">{product.cores}</p>}
      {product.designer && <p className="product-card__designer">{messages.shop.designerLabel}: {product.designer}</p>}
      {product.description && <p>{product.description}</p>}
      <div className="product-card__footer">
        <span className="product-card__price">{formatPrice(product.price, locale)}</span>
        <span className="product-card__stock">
          {product.stock > 0 ? `${messages.shop.stockLabel}: ${product.stock}` : messages.shop.outOfStock}
        </span>
      </div>
    </Link>
  )
}

export function ProductComingSoonCard() {
  const { messages } = useLocale()

  return (
    <div className="card product-card product-card--coming-soon">
      <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
      <h3>{messages.shop.comingSoonTitle}</h3>
      <p>{messages.shop.comingSoonBody}</p>
    </div>
  )
}

export default ProductCard
