import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './pages/home-v5.css'
import './pages/studio-v5.css'
import App from './App.tsx'
import AuthProvider from './components/AuthProvider.tsx'
import CartProvider from './components/CartProvider.tsx'
import LocaleProvider from './components/LocaleProvider.tsx'
import ThemeProvider from './components/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  </StrictMode>,
)
