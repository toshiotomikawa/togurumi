import type { Plugin } from 'vite'
import { HERO_PHOTO_SIZES, pickHeroPieces } from '../src/lib/hero'
import { photoProps } from '../src/lib/images'

const CATALOG_URL = 'https://togurumi.vercel.app/api/shop/products'

/**
 * At build time, reads the live catalog and lets the home page ask for its hero photos at once,
 * instead of waiting for the app to start and fetch the catalog. If the catalog cannot be read,
 * the build goes on without the hints and the page simply loads the photos later.
 */
export function heroPreload(): Plugin {
  return {
    name: 'togurumi-hero-preload',
    apply: 'build',
    async transformIndexHtml() {
      try {
        const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(8_000) })
        if (!response.ok) return []
        const { products = [] } = await response.json() as { products?: { name: string; image: string }[] }
        const hints = pickHeroPieces(products).map(product => photoProps(product.image, HERO_PHOTO_SIZES))
        if (hints.length === 0) return []
        // Only the home page shows the hero, so other pages skip the downloads.
        const script = `if (location.pathname === '/') for (const h of ${JSON.stringify(hints).replace(/</g, '\\u003c')}) {` +
          `const l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = h.src;` +
          `if (h.srcSet) { l.imageSrcset = h.srcSet; l.imageSizes = h.sizes } l.fetchPriority = 'high'; document.head.append(l) }`
        return [
          { tag: 'link', attrs: { rel: 'preconnect', href: 'https://ik.imagekit.io' }, injectTo: 'head-prepend' as const },
          { tag: 'script', children: script, injectTo: 'head' as const },
        ]
      } catch {
        return []
      }
    },
  }
}
