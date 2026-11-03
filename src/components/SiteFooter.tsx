import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/togurumi-logo.png'
import yarnBall from '../assets/togurumi-yarn-ball.png'
import { useLocale } from '../hooks/useLocale'
import { TOGURUMI_EMAIL, TOGURUMI_INSTAGRAM, TOGURUMI_YOUTUBE } from '../lib/togurumi'
import { ArrowIcon, Branch, InstagramIcon, MailIcon, OrnamentRule, YouTubeIcon } from './AtelierIcons'

const copy = {
  'pt-BR': { navigation: 'Navegação', institutional: 'Institucional', follow: 'Acompanhe a Togurumi', news: 'Receba novidades', newsIntro: 'Novas peças, encomendas e bastidores aparecem primeiro no Instagram.', newsCta: 'Seguir @togurumi', thin: 'Feito à mão. Feito para encantar.' },
  'en-US': { navigation: 'Browse', institutional: 'About', follow: 'Follow Togurumi', news: 'Get the news', newsIntro: 'New pieces, custom orders and studio moments show up first on Instagram.', newsCta: 'Follow @togurumi', thin: 'Made by hand. Made to charm.' },
  'es-ES': { navigation: 'Navegación', institutional: 'Institucional', follow: 'Sigue a Togurumi', news: 'Recibe novedades', newsIntro: 'Piezas nuevas, encargos y el día a día del taller aparecen primero en Instagram.', newsCta: 'Seguir a @togurumi', thin: 'Hecho a mano. Hecho para encantar.' },
}

function SiteFooter() {
  const { messages, locale } = useLocale()
  const { pathname } = useLocation()
  const t = copy[locale]
  const year = new Date().getFullYear()
  const thin = /^\/shop\/[^/]+/.test(pathname)

  const navLinks = [
    { to: '/', label: messages.nav.home },
    { to: '/shop', label: messages.nav.shop },
    { to: '/journal', label: messages.nav.journal },
  ]
  const infoLinks = [
    { to: '/faq', label: messages.nav.faq },
    { to: '/contact', label: messages.nav.contact },
    { to: '/privacy', label: messages.nav.privacy },
  ]

  if (thin) {
    return (
      <footer className="site-footer site-footer--thin">
        <OrnamentRule kind="knot" />
        <div className="site-footer__thin-row">
          <span>{t.thin}</span>
          <nav className="site-footer__thin-links" aria-label={t.institutional}>
            {infoLinks.map(({ to, label }) => <Link key={to} to={to}>{label}</Link>)}
            <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>
            <a href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><YouTubeIcon /></a>
          </nav>
          <span>Togurumi © {year}</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="site-footer site-footer--atelier">
      <Branch className="site-footer__leaf site-footer__leaf--left" />
      <Branch className="site-footer__leaf site-footer__leaf--right" />
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <Link to="/" className="site-footer__brand" aria-label="Togurumi">
            <span aria-hidden="true" className="site-footer__mark" style={{ maskImage: `url(${yarnBall})`, WebkitMaskImage: `url(${yarnBall})` }} />
            <img src={logo} alt="" className="site-footer__logo" />
          </Link>
        </div>

        <p className="site-footer__note">{messages.footer.note}</p>

        <div className="site-footer__columns">
          <nav className="site-footer__nav" aria-label={messages.footer.navLabel}>
            <h2>{t.navigation}</h2>
            {navLinks.map(({ to, label }) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
          <nav className="site-footer__nav" aria-label={t.institutional}>
            <h2>{t.institutional}</h2>
            {infoLinks.map(({ to, label }) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
        </div>

        <nav className="site-footer__social" aria-label={messages.footer.socialLabel}>
          <h2>{t.follow}</h2>
          <div>
            <a href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>
            <a href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><YouTubeIcon /></a>
            <a href={`mailto:${TOGURUMI_EMAIL}`} aria-label={TOGURUMI_EMAIL}><MailIcon /></a>
          </div>
        </nav>

        <div className="site-footer__news">
          <h2>{t.news}</h2>
          <p>{t.newsIntro}</p>
          <a className="site-footer__news-field" href={TOGURUMI_INSTAGRAM} target="_blank" rel="noopener noreferrer">
            <InstagramIcon />
            <span>{t.newsCta}</span>
            <span className="site-footer__news-go" aria-hidden="true"><ArrowIcon /></span>
          </a>
        </div>
      </div>
      <p className="site-footer__meta">© {year} Togurumi · {messages.footer.tagline}</p>
    </footer>
  )
}

export default SiteFooter
