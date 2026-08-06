import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { matchesSearch } from '../lib/shop'

const PAGE_SIZE = 8
const SKELETON_COUNT = 8

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M16 16l4.5 4.5" />
    </svg>
  )
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function SearchPage() {
  const { messages } = useLocale()
  const [searchParams, setSearchParams] = useSearchParams()
  const { products, loaded } = useShopProducts()
  const urlQuery = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const [query, setQuery] = useState(urlQuery)
  const [urlQuerySnapshot, setUrlQuerySnapshot] = useState(urlQuery)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Adopt URL query on back/forward or deep links (React "adjust state while rendering").
  if (urlQuery !== urlQuerySnapshot) {
    setUrlQuerySnapshot(urlQuery)
    setQuery(urlQuery)
  }

  const paginationKey = `${query}\0${category ?? ''}`
  const [pagination, setPagination] = useState({ key: paginationKey, count: PAGE_SIZE })

  if (pagination.key !== paginationKey) {
    setPagination({ key: paginationKey, count: PAGE_SIZE })
  }

  const visibleCount = pagination.key === paginationKey ? pagination.count : PAGE_SIZE

  const filtered = useMemo(() => {
    return products.filter((product) => (!category || product.category === category) && matchesSearch(product, query))
  }, [products, query, category])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const hasQuery = query.trim().length > 0
  const hasCategory = Boolean(category)
  const hasFilters = hasQuery || hasCategory

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPagination((current) => ({
            ...current,
            count: Math.min(current.count + PAGE_SIZE, filtered.length),
          }))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filtered.length, hasMore, paginationKey])

  function writeQueryParam(nextQuery: string) {
    const next = new URLSearchParams(searchParams)
    if (nextQuery) next.set('q', nextQuery)
    else next.delete('q')
    setUrlQuerySnapshot(nextQuery)
    setSearchParams(next, { replace: true })
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    writeQueryParam(value)
  }

  function clearQuery() {
    setQuery('')
    writeQueryParam('')
  }

  function clearCategory() {
    const next = new URLSearchParams(searchParams)
    next.delete('category')
    setSearchParams(next, { replace: true })
  }

  function showMore() {
    setPagination((current) => ({
      ...current,
      count: Math.min(current.count + PAGE_SIZE, filtered.length),
    }))
  }

  function resultSummary() {
    if (!loaded) return ''
    if (products.length === 0) return messages.search.catalogEmptySummary
    const count = filtered.length
    const one = count === 1
    if (hasQuery && hasCategory) {
      return fillTemplate(
        one ? messages.search.resultsForQueryInCategoryOne : messages.search.resultsForQueryInCategory,
        {
          count,
          query: query.trim(),
          category: category ?? '',
        },
      )
    }
    if (hasQuery) {
      return fillTemplate(one ? messages.search.resultsForQueryOne : messages.search.resultsForQuery, {
        count,
        query: query.trim(),
      })
    }
    if (hasCategory) {
      return fillTemplate(one ? messages.search.resultsInCategoryOne : messages.search.resultsInCategory, {
        count,
        category: category ?? '',
      })
    }
    return fillTemplate(one ? messages.search.resultsAllOne : messages.search.resultsAll, { count })
  }

  function renderEmptyState() {
    if (products.length === 0) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">{messages.search.catalogEmptyTitle}</p>
          <p className="search-empty__body">{messages.search.catalogEmptyBody}</p>
        </div>
      )
    }

    if (hasQuery && hasCategory) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">
            {fillTemplate(messages.search.emptyBothTitle, {
              query: query.trim(),
              category: category ?? '',
            })}
          </p>
          <p className="search-empty__body">{messages.search.emptyBothBody}</p>
          <div className="search-empty__actions">
            <button type="button" className="button" onClick={clearQuery}>
              {messages.search.clearQuery}
            </button>
            <button type="button" className="button" onClick={clearCategory}>
              {messages.search.clearFilter}
            </button>
          </div>
        </div>
      )
    }

    if (hasQuery) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">
            {fillTemplate(messages.search.emptyQueryTitle, { query: query.trim() })}
          </p>
          <p className="search-empty__body">{messages.search.emptyQueryBody}</p>
          <div className="search-empty__actions">
            <button type="button" className="button" onClick={clearQuery}>
              {messages.search.clearQuery}
            </button>
          </div>
        </div>
      )
    }

    if (hasCategory) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">
            {fillTemplate(messages.search.emptyCategoryTitle, { category: category ?? '' })}
          </p>
          <p className="search-empty__body">{messages.search.emptyCategoryBody}</p>
          <div className="search-empty__actions">
            <button type="button" className="button" onClick={clearCategory}>
              {messages.search.clearFilter}
            </button>
          </div>
        </div>
      )
    }

    // Unfiltered empty catalog is handled above; this path should not show while products exist.
    return null
  }

  const summary = resultSummary()

  return (
    <div className="page page--search">
      <section className="search-hero">
        <span className="search-hero__eyebrow">{messages.search.eyebrow}</span>
        <h1 className="search-hero__title">{messages.search.title}</h1>
        <p className="search-hero__intro">{messages.search.intro}</p>
      </section>

      <section className="section search-panel" aria-label={messages.search.ariaLabel}>
        <form
          className="search-bar search-bar--page"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="search-bar__field">
            <span className="visually-hidden">{messages.search.ariaLabel}</span>
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder={messages.search.placeholder}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
          {hasQuery ? (
            <button type="button" className="search-bar__clear" onClick={clearQuery}>
              {messages.search.clearQuery}
            </button>
          ) : null}
        </form>

        {hasCategory ? (
          <div className="search-active-filter" role="group" aria-label={messages.search.filteringBy}>
            <span className="search-active-filter__pill">
              <span className="search-active-filter__label">{messages.search.filteringBy}</span>
              <span className="search-active-filter__value">{category}</span>
            </span>
            <button type="button" className="tag-filter__item" onClick={clearCategory}>
              {messages.search.clearFilter}
            </button>
          </div>
        ) : null}

        {loaded ? (
          <p className="search-summary" role="status" aria-live="polite">
            {summary}
          </p>
        ) : null}

        {!loaded ? (
          <div
            className="card-grid card-grid--products"
            aria-busy="true"
            aria-live="polite"
            aria-label={messages.search.loadingLabel}
          >
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <ProductCardSkeleton key={`search-skeleton-${index}`} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="card-grid card-grid--products">
              {visible.map((product) => (
                <ProductCard product={product} key={product.name} />
              ))}
            </div>

            {hasMore ? (
              <div className="search-pagination">
                <p className="search-pagination__status" role="status">
                  {fillTemplate(messages.search.showingCount, {
                    visible: visible.length,
                    total: filtered.length,
                  })}
                </p>
                <button type="button" className="button search-pagination__more" onClick={showMore}>
                  {messages.search.showMore}
                </button>
                <div ref={sentinelRef} className="search-sentinel" aria-hidden="true" />
              </div>
            ) : filtered.length > PAGE_SIZE ? (
              <p className="search-pagination__status search-pagination__status--end" role="status">
                {fillTemplate(messages.search.showingCount, {
                  visible: visible.length,
                  total: filtered.length,
                })}
              </p>
            ) : null}
          </>
        ) : (
          renderEmptyState()
        )}

        {loaded && filtered.length > 0 && !hasFilters ? (
          <p className="search-browse-hint">{messages.search.browseHint}</p>
        ) : null}
      </section>
    </div>
  )
}

export default SearchPage
