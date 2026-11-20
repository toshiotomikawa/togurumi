/* eslint-disable react-refresh/only-export-components -- a build-time entry, never loaded by the dev server */
/**
 * Build-time entry (see build/bakeShell.mjs): draws the header and the opening of the home and
 * shop pages with the real components, so the HTML shows them before the app has loaded.
 * The app then renders the same markup from the same data and takes over.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import CartProvider from './components/CartProvider'
import SiteHeader from './components/SiteHeader'
import ThemeProvider from './components/ThemeProvider'
import { LocaleContext } from './context/locale'
import { getMessages } from './i18n/messages'
import { readShellSeed } from './lib/shellSeed'
import type { SupportedLocale } from './lib/i18n'
import { HomeHero } from './pages/HomePage'
import { ShopHero } from './pages/ShopPage'

export function renderShell(page: 'home' | 'shop', locale: SupportedLocale): string {
  const seed = readShellSeed()
  const messages = getMessages(locale)
  const home = { ...messages.home, ...seed?.content[locale]?.home }
  const shop = { ...messages.shop, ...seed?.content[locale]?.shop }
  return renderToString(
    <LocaleContext.Provider value={{ preference: 'system', locale, messages, setPreference: () => {} }}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <StaticRouter location={page === 'home' ? '/' : '/shop'}>
              <a className="skip-link" href="#main-content">{messages.nav.skipToContent}</a>
              <SiteHeader />
              <main id="main-content" className="site-main" tabIndex={-1}>
                {page === 'home'
                  ? <div className="atelier-home"><HomeHero pieces={seed?.pieces ?? []} content={home} busy /></div>
                  : <div className="page page--shop"><ShopHero content={shop} cover={seed?.cover} loaded={false} /></div>}
              </main>
            </StaticRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocaleContext.Provider>,
  )
}

// Helpers the bake step needs from the same bundle.
export { HERO_PHOTO_SIZES, pickHeroPieces, SHOP_COVER_SIZES } from './lib/hero'
export { avifSrcSet, photoProps } from './lib/images'
