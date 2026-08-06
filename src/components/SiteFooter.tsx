import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_EMAIL, TOGURUMI_INSTAGRAM, TOGURUMI_YOUTUBE } from '../lib/togurumi'

function SiteFooter() {
  const { messages } = useLocale()
  const year = new Date().getFullYear()

  const navLinks = [
    { to: '/', label: messages.nav.home },
    { to: '/shop', label: messages.nav.shop },
    { to: '/journal', label: messages.nav.journal },
    { to: '/faq', label: messages.nav.faq },
    { to: '/contact', label: messages.nav.contact },
    { to: '/privacy', label: messages.nav.privacy },
  ]

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <p className="site-footer__brand">
            <span aria-hidden="true" className="site-footer__icon" />
            <span className="site-footer__name">Togurumi</span>
            <span className="site-footer__kana" lang="ja">
              トグルミ
            </span>
          </p>
          <p className="site-footer__note">{messages.footer.note}</p>
          <p className="site-footer__meta">
            © {year} Togurumi · {messages.footer.tagline}
          </p>
        </div>

        <div className="site-footer__columns">
          <nav className="site-footer__nav" aria-label={messages.footer.navLabel}>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>

          <nav className="site-footer__social" aria-label={messages.footer.socialLabel}>
            <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer">
              YouTube
            </a>
            <a href={`mailto:${TOGURUMI_EMAIL}`}>{TOGURUMI_EMAIL}</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
