import { useEffect, useRef, useState } from 'react'
import type { ShopProduct } from '../lib/shop'

const POLL_INTERVAL_MS = 60_000

async function fetchShopProducts(): Promise<ShopProduct[]> {
  const res = await fetch('/api/shop/products', { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return data.products ?? []
}

export function useShopProducts() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

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