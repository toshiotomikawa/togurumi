import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { useLocale } from '../hooks/useLocale'
import type { ShopProduct } from '../lib/shop'

function ShopPage() {
  const { messages } = useLocale()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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

  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)))
  const visibleProducts = activeCategory
    ? products.filter((product) => product.category === activeCategory)
    : products

  return (
    <div className="page">
      <section className="hero">
        <span className="hero__eyebrow">{messages.shop.eyebrow}</span>
        <h1>{messages.shop.title}</h1>
        <p>{messages.shop.intro}</p>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>{messages.shop.availableHeading}</h2>
        </div>
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
          <h2>{messages.shop.galleryHeading}</h2>
        </div>
        <div className="gallery-grid">
          {messages.shop.galleryItems.map((item) => (
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

      <section className="section">
        <div className="section__head">
          <h2>{messages.shop.patternsHeading}</h2>
        </div>
        <p>{messages.shop.patternsIntro}</p>
        <div className="card-grid">
          {messages.shop.patternsItems.map((pattern) => (
            <div className="card pattern-card" key={pattern.name}>
              <span className="pattern-card__status">{pattern.status}</span>
              <h3>{pattern.name}</h3>
              <p>{pattern.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ShopPage
