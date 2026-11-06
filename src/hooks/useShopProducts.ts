import { useEffect, useRef, useState } from 'react'
import type { ShopProduct } from '../lib/shop'

const POLL_INTERVAL_MS = 60_000
const CACHE_KEY = 'togurumi-products-v1'

let memoryCache: ShopProduct[] | undefined

function readCachedProducts(): ShopProduct[] | undefined {
  if (memoryCache) return memoryCache
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (stored) memoryCache = JSON.parse(stored) as ShopProduct[]
  } catch {
    // Start without a saved copy when browser storage is blocked or damaged.
  }
  return memoryCache
}

async function fetchShopProducts(): Promise<ShopProduct[]> {
  const res = await fetch('/api/shop/products', { cache: 'no-store' })
  if (!res.ok) throw new Error('shop_load_failed')
  const data = await res.json()
  const products: ShopProduct[] = data.products ?? []
  memoryCache = products
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products))
  } catch {
    // The memory copy is enough when browser storage is blocked or full.
  }
  return products
}

/** Quietly loads the catalog before the shop is opened, so it appears complete at once. */
export async function preloadShopProducts() {
  await fetchShopProducts()
}

export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>(() => readCachedProducts() ?? [])
  const [loaded, setLoaded] = useState(() => readCachedProducts() !== undefined)
  const loadedRef = useRef(loaded)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const next = await fetchShopProducts()
        if (!cancelled) setProducts(next)
      } catch {
        if (!cancelled && !loadedRef.current) setProducts([])
      } finally {
        if (!cancelled && !loadedRef.current) {
          loadedRef.current = true
          setLoaded(true)
        }
      }
    }

    void load()

    const intervalId = window.setInterval(() => void load(), POLL_INTERVAL_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') void load()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  return { products, loaded }
}
