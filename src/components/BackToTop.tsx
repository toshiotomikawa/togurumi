import { useEffect, useState } from 'react'
import { useLocale } from '../hooks/useLocale'

/** Bottom-right button that appears once the reader is a screen down the page. */
function BackToTop() {
  const { messages } = useLocale()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toTop() {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }

  return (
    <button type="button" className={`back-to-top${shown ? ' is-shown' : ''}`} aria-label={messages.nav.backToTop} onClick={toTop}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}

export default BackToTop
