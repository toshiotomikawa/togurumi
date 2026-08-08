import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import SiteFooter from './components/SiteFooter'
import SiteHeader from './components/SiteHeader'
import { useLocale } from './hooks/useLocale'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'
import CartPage from './pages/CartPage'
import ContactPage from './pages/ContactPage'
import FaqPage from './pages/FaqPage'
import HomePage from './pages/HomePage'
import JournalEditorPage from './pages/JournalEditorPage'
import JournalPage from './pages/JournalPage'
import JournalPostPage from './pages/JournalPostPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ProductPage from './pages/ProductPage'
import ProductImagesPage from './pages/ProductImagesPage'
import SearchPage from './pages/SearchPage'
import ShopPage from './pages/ShopPage'

function App() {
  const { messages } = useLocale()

  return (
    <>
      <a className="skip-link" href="#main-content">
        {messages.nav.skipToContent}
      </a>
      <SiteHeader />
      <main id="main-content" className="site-main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:slug" element={<JournalPostPage />} />
          <Route path="/reviews" element={<Navigate to="/#reviews" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
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
            path="/admin/account"
            element={
              <ProtectedRoute roles={['admin', 'moderator']}>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  )
}

export default App
