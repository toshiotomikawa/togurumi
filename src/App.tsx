import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BackToTop from './components/BackToTop'
import ProtectedRoute from './components/ProtectedRoute'
import SiteFooter from './components/SiteFooter'
import SiteHeader from './components/SiteHeader'
import { useLocale } from './hooks/useLocale'
import { preloadShopProducts } from './hooks/useShopProducts'
import { preloadJournal } from './lib/journal'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'

// The home and shop pages, where most visits start, come with the app; every other page loads
// when first opened, and staff pages never reach shoppers at all.
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutCancelPage = lazy(() => import('./pages/CheckoutCancelPage'))
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const JournalPage = lazy(() => import('./pages/JournalPage'))
const JournalPostPage = lazy(() => import('./pages/JournalPostPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const RefundPage = lazy(() => import('./pages/RefundPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const JournalEditorPage = lazy(() => import('./pages/JournalEditorPage'))
const ProductImagesPage = lazy(() => import('./pages/ProductImagesPage'))
const RefundRequestsPage = lazy(() => import('./pages/RefundRequestsPage'))

function App() {
  const { messages, locale } = useLocale()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void preloadJournal(locale).catch(() => {})
      void preloadShopProducts().catch(() => {})
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [locale])

  return (
    <>
      <a className="skip-link" href="#main-content">
        {messages.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          <Route path="/reembolso" element={<RefundPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:slug" element={<JournalPostPage />} />
          <Route path="/reviews" element={<Navigate to="/#reviews" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<Navigate to="/#faq" replace />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/journal"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <JournalEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <ProductImagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <RefundRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/account"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  )
}

export default App
