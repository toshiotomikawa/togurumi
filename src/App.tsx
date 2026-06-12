import { Route, Routes } from 'react-router-dom'
import SiteFooter from './components/SiteFooter'
import SiteHeader from './components/SiteHeader'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import JournalPage from './pages/JournalPage'
import JournalPostPage from './pages/JournalPostPage'
import NotFoundPage from './pages/NotFoundPage'
import PatternsPage from './pages/PatternsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'

function App() {
  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:slug" element={<JournalPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  )
}

export default App
