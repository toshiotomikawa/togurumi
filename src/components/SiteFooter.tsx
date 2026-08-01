import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_INSTAGRAM, TOGURUMI_YOUTUBE } from '../lib/togurumi'

function SiteFooter() {
  const { messages } = useLocale()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__brand">
          <span aria-hidden="true" className="site-footer__icon" />
          © {new Date().getFullYear()} Togurumi · {messages.footer.tagline}
        </p>
        <nav className="site-footer__nav" aria-label="Footer">
          <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
          <Link to="/privacy">{messages.nav.privacy}</Link>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
