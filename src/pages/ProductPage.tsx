import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { formatPrice, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'
import NotFoundPage from './NotFoundPage'

function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const { addItem } = useCart()
  const [products, setProducts] = useState<ShopProduct[] | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/api/shop/products')
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? [])
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (products === null) return null

  const product = products.find((item) => slugify(item.name) === slug)
  if (!product) return <NotFoundPage />

  function handleAddToCart() {
    if (!product) return
    addItem({ slug: slugify(product.name), name: product.name, price: product.price })
    setAdded(true)
  }

  return (
    <div className="page page--narrow">
      <Link to="/shop" className="back-link">
        {messages.shop.backLink}
      </Link>
      <article className="product-detail">
        {product.image ? (
          <img className="product-detail__image" src={product.image} alt={product.name} />
        ) : (
          <div className="product-detail__image product-detail__image--placeholder" aria-hidden="true" />
        )}
        <span className="product-card__category">{product.category}</span>
        <h1>{product.name}</h1>
        {product.description && <p>{product.description}</p>}
        <ul className="product-detail__specs">
          {product.yarn && (
            <li>
              <strong>{messages.shop.yarnLabel}:</strong> {product.yarn}
            </li>
          )}
          {product.eyes && (
            <li>
              <strong>{messages.shop.eyesLabel}:</strong> {product.eyes}
            </li>
          )}
        </ul>
        <div className="product-detail__footer">
          <span className="product-card__price">{formatPrice(product.price, locale)}</span>
          <span className="product-card__stock">
            {product.stock > 0 ? `${messages.shop.stockLabel}: ${product.stock}` : messages.shop.outOfStock}
          </span>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {added ? messages.shop.addedToCart : messages.shop.addToCart}
        </button>
      </article>
    </div>
  )
}

export default ProductPage
