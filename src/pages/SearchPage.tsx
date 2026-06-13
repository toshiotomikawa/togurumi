import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useLocale } from '../hooks/useLocale'
import { matchesSearch, type ShopProduct } from '../lib/shop'

const PAGE_SIZE = 8

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M16 16l4.5 4.5" />
    </svg>
  )
}

function SearchPage() {
  const { messages } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const category = searchParams.get('category')

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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, category])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (query) {
      next.set('q', query)
    } else {
      next.delete('q')
    }
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const filtered = useMemo(() => {
    return products.filter((product) => (!category || product.category === category) && matchesSearch(product, query))
  }, [products, query, category])

  const visible = filtered.slice(0, visibleCount)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filtered.length])

  function clearCategory() {
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="page">
      <section className="hero">
        <span className="hero__eyebrow">{messages.search.eyebrow}</span>
        <h1>{messages.search.title}</h1>
      </section>

      <section className="section">
        <label className="search-bar">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.search.placeholder}
          />
        </label>

        {category && (
          <div className="tag-filter">
            <span className="tag-filter__active">
              {messages.search.filteringBy}: {category}
            </span>
            <button type="button" className="tag-filter__item" onClick={clearCategory}>
              {messages.search.clearFilter}
            </button>
          </div>
        )}

        {filtered.length > 0 ? (
          <>
            <div className="card-grid">
              {visible.map((product) => (
                <ProductCard product={product} key={product.name} />
              ))}
            </div>
            {visibleCount < filtered.length && <div ref={sentinelRef} className="search-sentinel" aria-hidden="true" />}
          </>
        ) : (
          <p>{messages.search.noResults}</p>
        )}
      </section>
    </div>
  )
}

export default SearchPage
