import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowIcon, Branch, CartIcon, CrownIcon, GiftIcon, HandHeartIcon, HeartIcon, InstagramIcon, OrnamentRule, SprigIcon, YouTubeIcon } from '../components/AtelierIcons'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ReviewsSection from '../components/ReviewsSection'
import { useCart } from '../hooks/useCart'
import { useEditableContent } from '../hooks/useEditableContent'
import { useFavorites } from '../hooks/useFavorites'
import { useJournalPosts } from '../hooks/useJournal'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, parseProductColors, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'
import { TOGURUMI_INSTAGRAM_DM, TOGURUMI_LATEST_VIDEO, TOGURUMI_YOUTUBE } from '../lib/togurumi'

/** A piece counts as "last units" only when the real stock is this low. */
const LOW_STOCK = 3

const copy = {
  'pt-BR': {
    handmade: ['Feito à mão', 'Cada peça é crochetada pela Bella, ponto a ponto.'],
    yarn: (yarn: string) => [`Fio ${yarn}`, `Todas as peças da loja usam fio ${yarn}.`],
    maker: ['Da agulha da Bella', 'Uma artesã, do primeiro ponto ao acabamento.'],
    order: ['Encomendas', 'Peça a sua pelo Instagram.'],
    gift: ['Para presentear', 'Um mimo especial para quem você ama.'],
    kind: 'Amigurumi artesanal',
    favorite: 'Favoritar', unfavorite: 'Tirar dos favoritos', add: 'Adicionar ao carrinho', added: 'Adicionado ao carrinho', choose: 'Escolher cor', soldOut: 'Esgotado',
    lastTitle: 'Últimas unidades', lastIntro: `Peças com ${LOW_STOCK} unidades ou menos no estoque.`, lastCta: 'Comprar agora',
    left: (n: number) => (n === 1 ? 'Resta 1' : `Restam ${n}`),
    explore: 'Qual é o seu tipo de encanto?', commission: 'Encomendas', browse: 'Explorar',
    studio: 'Por dentro do ateliê', about: 'Um fio, uma agulha. E a Bella.', sign: 'Com carinho, Bella',
  },
  'en-US': {
    handmade: ['Made by hand', 'Every piece is crocheted by Bella, stitch by stitch.'],
    yarn: (yarn: string) => [`${yarn} yarn`, `Every piece in the shop uses ${yarn} yarn.`],
    maker: ["From Bella's hook", 'One maker, from the first stitch to the finish.'],
    order: ['Custom orders', 'Ask for yours on Instagram.'],
    gift: ['Made for gifting', 'A special treat for someone you love.'],
    kind: 'Handmade amigurumi',
    favorite: 'Add to favorites', unfavorite: 'Remove from favorites', add: 'Add to cart', added: 'Added to cart', choose: 'Choose a color', soldOut: 'Sold out',
    lastTitle: 'Last pieces', lastIntro: `Pieces with ${LOW_STOCK} or fewer left in stock.`, lastCta: 'Shop now',
    left: (n: number) => `${n} left`,
    explore: 'What kind of charm is yours?', commission: 'Custom pieces', browse: 'Explore',
    studio: 'Inside the studio', about: 'Some yarn, a hook. And Bella.', sign: 'With love, Bella',
  },
  'es-ES': {
    handmade: ['Hecho a mano', 'Cada pieza la teje Bella, punto a punto.'],
    yarn: (yarn: string) => [`Hilo ${yarn}`, `Todas las piezas de la tienda usan hilo ${yarn}.`],
    maker: ['De la aguja de Bella', 'Una artesana, del primer punto al acabado.'],
    order: ['Encargos', 'Pide la tuya por Instagram.'],
    gift: ['Para regalar', 'Un detalle especial para quien quieres.'],
    kind: 'Amigurumi artesanal',
    favorite: 'Añadir a favoritos', unfavorite: 'Quitar de favoritos', add: 'Añadir al carrito', added: 'Añadido al carrito', choose: 'Elegir color', soldOut: 'Agotado',
    lastTitle: 'Últimas unidades', lastIntro: `Piezas con ${LOW_STOCK} unidades o menos en stock.`, lastCta: 'Comprar ahora',
    left: (n: number) => (n === 1 ? 'Queda 1' : `Quedan ${n}`),
    explore: '¿Cuál es tu tipo de encanto?', commission: 'Encargos', browse: 'Explorar',
    studio: 'Dentro del taller', about: 'Un hilo, una aguja. Y Bella.', sign: 'Con cariño, Bella',
  },
}

/** Group shots read best in the wide hero; any other photographed piece fills the gaps. */
const HERO_PREFERRED = ['pato-formoso', 'capivara-sereia', 'bebe-baleia']

function YarnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="22" cy="26" r="15" />
      <path d="M9 20c8-2 18 2 26 12M12 13c8 1 16 8 20 21M22 11c5 4 9 12 9 23M8 29c7-3 16-1 24 8" />
      <path d="M36 23c4-2 6-6 5-10" />
    </svg>
  )
}

function PiecePhoto({ product, className = '', eager = false }: { product: ShopProduct; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const { messages } = useLocale()
  return product.image && failed !== product.image ? (
    <img className={className} src={product.image} alt={product.name} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} onError={() => setFailed(product.image)} />
  ) : <div className={`atelier-photo-fallback ${className}`} role="img" aria-label={messages.shop.photoComingSoon}>{messages.shop.photoComingSoon}</div>
}

function CollectionCard({ product }: { product: ShopProduct }) {
  const { locale } = useLocale()
  const t = copy[locale]
  const { addItem } = useCart()
  const { isFavorite, toggle } = useFavorites()
  const [added, setAdded] = useState(false)
  const slug = slugify(product.name)
  const href = `/shop/${slug}`
  const colors = parseProductColors(product.cores)
  const favorite = isFavorite(slug)
  const soldOut = product.stock <= 0

  return (
    <article className="atelier-card">
      <Link className="atelier-card__photo" to={href} tabIndex={-1} aria-hidden="true"><PiecePhoto product={product} /></Link>
      <button type="button" className={`atelier-card__fav${favorite ? ' is-on' : ''}`} aria-pressed={favorite} aria-label={`${favorite ? t.unfavorite : t.favorite}: ${product.name}`} onClick={() => toggle(slug)}><HeartIcon /></button>
      <div className="atelier-card__body">
        <h3><Link to={href}>{product.name}</Link></h3>
        <p className="atelier-card__kind">{t.kind}</p>
        <div className="atelier-card__foot">
          <span className="atelier-card__price">{formatPrice(product.price, locale)}</span>
          {soldOut ? <span className="atelier-card__soldout">{t.soldOut}</span>
            : colors.length > 1 ? <Link className="atelier-card__cart" to={href} aria-label={`${t.choose}: ${product.name}`}><CartIcon /></Link>
            : <button type="button" className={`atelier-card__cart${added ? ' is-added' : ''}`} aria-label={`${t.add}: ${product.name}`} onClick={() => { addItem({ slug, name: product.name, price: product.price, color: colors[0] }); setAdded(true) }}><CartIcon /></button>}
        </div>
        <span className="visually-hidden" role="status">{added ? `${t.added}: ${product.name}` : ''}</span>
      </div>
    </article>
  )
}

function HomePage() {
  const { messages, locale } = useLocale()
  const t = copy[locale]
  const { products, loaded } = useShopProducts()
  const { posts, error: journalError } = useJournalPosts(locale)
  const editor = useEditableContent('home', locale, messages.home, messages.contentEditor.draftRestored)
  const photographed = products.filter(product => product.image)
  const available = photographed.filter(product => product.stock > 0)
  const selected = [...available.filter(product => product.highlight), ...available.filter(product => !product.highlight)].slice(0, 8)
  const heroPieces = [
    ...HERO_PREFERRED.map(slug => photographed.find(product => slugify(product.name) === slug)).filter((product): product is ShopProduct => Boolean(product)),
    ...photographed.filter(product => !HERO_PREFERRED.includes(slugify(product.name))),
  ].slice(0, 3)
  const lastPieces = available.filter(product => product.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock).slice(0, 4)
  const latestPosts = posts.slice(0, 3)

  // The yarn benefit only shows when the catalog really agrees on a single yarn.
  const yarns = [...new Set(products.map(product => product.yarn?.trim().toLowerCase()).filter(Boolean))]
  const sharedYarn = products.length > 0 && yarns.length === 1 && products.every(product => product.yarn?.trim()) ? yarns[0]! : ''
  const benefits = [
    { Icon: HandHeartIcon, text: t.handmade },
    sharedYarn ? { Icon: YarnIcon, text: t.yarn(sharedYarn) } : { Icon: SprigIcon, text: t.maker },
    { Icon: InstagramIcon, text: t.order, href: TOGURUMI_INSTAGRAM_DM },
    { Icon: GiftIcon, text: t.gift },
  ]

  const category = photographed.find(product => product.category)?.category
  const browseLinks = [
    { label: editor.content.storeHeading, to: '/shop', product: selected[2] ?? photographed[2] },
    { label: category, to: `/search?category=${encodeURIComponent(category ?? '')}`, product: selected[4] ?? photographed[4] },
    { label: t.commission, to: '/contact', product: selected[1] ?? photographed[1] },
  ].filter((item): item is { label: string; to: string; product: ShopProduct } => Boolean(item.product && item.label))
  const storyPiece = selected[3] ?? photographed[3]

  const fields = ['eyebrow', 'title', 'intro', 'shopCta', 'journalCta', 'highlightsHeading', 'storeHeading', 'viewAll', 'journalHeading', 'allEntries', 'youtubeHeading', 'youtubeIntro', 'youtubeVideoCta', 'youtubeChannelCta'] as const
  const multiline = new Set<string>(['intro', 'youtubeIntro'])

  return (
    <div className="atelier-home">
      {editor.editing && editor.draft ? <section className="atelier-editor atelier-wrap">
        <div className="content-editor__fields">
          {fields.map(field => <EditField key={field} label={messages.contentEditor.fields[field]} value={editor.draft![field]} multiline={multiline.has(field)} onChange={(value) => editor.updateField(field, value)} />)}
        </div>
      </section> : <section className="atelier-hero" aria-labelledby="home-title">
        <div className="atelier-hero__stage" aria-busy={!loaded}>
          {heroPieces.map((product, index) => <div className={`atelier-hero__tile atelier-hero__tile--${index}`} key={product.name}><PiecePhoto product={product} eager={index === 0} /></div>)}
          <span className="atelier-hero__warmth" aria-hidden="true" />
        </div>
        <Branch className="atelier-hero__leaf" />
        <div className="atelier-wrap atelier-hero__inner">
          <div className="atelier-hero__words">
            {editor.content.eyebrow && <p className="atelier-hero__eyebrow">{editor.content.eyebrow}</p>}
            <h1 id="home-title">{editor.content.title}</h1>
            <OrnamentRule kind="heart" className="atelier-hero__rule" />
            <p>{editor.content.intro}</p>
            <div className="atelier-hero__actions">
              <Link className="atelier-button" to="/shop">{editor.content.shopCta}<ArrowIcon /></Link>
              <Link className="atelier-link" to="/journal">{editor.content.journalCta}</Link>
            </div>
          </div>
        </div>
      </section>}

      {editor.canEdit && <div className="atelier-wrap"><EditActions editLabel={messages.contentEditor.editButton} saveLabel={messages.contentEditor.save} cancelLabel={messages.contentEditor.cancel} editing={editor.editing} saving={editor.saving} onEdit={editor.startEditing} onSave={() => void editor.save(messages.contentEditor)} onCancel={editor.cancelEditing} /></div>}
      <div className="atelier-wrap"><EditFeedback feedback={editor.feedback} /></div>

      <ul className="atelier-benefits atelier-wrap">
        {benefits.map(({ Icon, text: [title, text], href }) => {
          const body = <><Icon className="atelier-benefits__icon" /><div><h2>{title}</h2><p>{text}</p></div></>
          return <li key={title}>{href ? <a className="atelier-benefits__link" href={href} target="_blank" rel="noopener noreferrer">{body}</a> : body}</li>
        })}
      </ul>

      <section className="atelier-collection atelier-wrap atelier-wrap--wide" aria-labelledby="collection-title">
        <div className="atelier-heading">
          <h2 id="collection-title"><SprigIcon className="atelier-heading__sprig" />{editor.content.highlightsHeading}</h2>
          <Link className="atelier-link" to="/shop">{editor.content.viewAll}</Link>
        </div>
        {!loaded ? <div className="atelier-cards" aria-busy="true" aria-label={messages.shop.loadingLabel}>{Array.from({ length: 8 }, (_, i) => <div className="atelier-card atelier-loading" key={i} />)}</div>
          : selected.length ? <div className="atelier-cards">{selected.map(product => <CollectionCard key={product.name} product={product} />)}</div>
          : <div className="atelier-empty"><h3>{messages.shop.emptyTitle}</h3><p>{messages.shop.availableEmpty}</p><Link className="atelier-button" to="/shop">{editor.content.shopCta}</Link></div>}
      </section>

      {lastPieces.length > 0 && <section className="atelier-band atelier-wrap atelier-wrap--wide" aria-labelledby="last-title">
        <Branch className="atelier-band__leaf" />
        <div className="atelier-band__words">
          <CrownIcon className="atelier-band__crown" />
          <div>
            <h2 id="last-title">{t.lastTitle}</h2>
            <p>{t.lastIntro}</p>
            <Link className="atelier-button atelier-button--small" to="/shop">{t.lastCta}<ArrowIcon /></Link>
          </div>
        </div>
        <div className="atelier-band__photos">
          {lastPieces.map(product => <Link className="atelier-band__photo" key={product.name} to={`/shop/${slugify(product.name)}`}>
            <PiecePhoto product={product} />
            <span className="atelier-band__name">{product.name}</span>
            <span className="atelier-band__badge">{t.left(product.stock)}</span>
          </Link>)}
        </div>
      </section>}

      {browseLinks.length > 0 && <section className="atelier-explore atelier-wrap" aria-labelledby="explore-title">
        <div className="atelier-heading"><h2 id="explore-title"><SprigIcon className="atelier-heading__sprig" />{t.explore}</h2></div>
        <div className="atelier-explore__grid">
          {browseLinks.map(item => <Link className="atelier-explore__tile" to={item.to} key={item.to}>
            <PiecePhoto product={item.product} />
            <span className="atelier-explore__label"><strong>{item.label}</strong><span>{t.browse}<ArrowIcon /></span></span>
          </Link>)}
        </div>
      </section>}

      <section className="atelier-story atelier-wrap" aria-labelledby="story-title">
        <div className="atelier-story__photo">{storyPiece && <PiecePhoto product={storyPiece} />}</div>
        <div className="atelier-story__words">
          <p className="atelier-story__eyebrow">{t.studio}</p>
          <h2 id="story-title">{t.about}</h2>
          <OrnamentRule kind="heart" className="atelier-story__rule" />
          <p>{messages.about.storyBody}</p>
          <p className="atelier-story__sign">{t.sign}</p>
          <div className="atelier-story__video">
            <h3><YouTubeIcon />{editor.content.youtubeHeading}</h3>
            <p>{editor.content.youtubeIntro}</p>
            <div className="atelier-story__actions">
              <a className="atelier-button atelier-button--small" href={TOGURUMI_LATEST_VIDEO} target="_blank" rel="noopener noreferrer">{editor.content.youtubeVideoCta}<ArrowIcon /></a>
              <a className="atelier-link" href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer">{editor.content.youtubeChannelCta}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="atelier-journal atelier-wrap" aria-labelledby="journal-title">
        <div className="atelier-heading">
          <h2 id="journal-title"><SprigIcon className="atelier-heading__sprig" />{editor.content.journalHeading}</h2>
          <Link className="atelier-link" to="/journal">{editor.content.allEntries}</Link>
        </div>
        {journalError ? <p role="alert">{messages.auth.genericError}</p>
          : latestPosts.length ? <div className="atelier-journal__list">{latestPosts.map(post => <Link className="atelier-journal__entry" to={`/journal/${post.slug}`} key={post.id}>
            <span className="atelier-journal__date">{post.date}</span>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </Link>)}</div>
          : <p className="atelier-journal__empty"><Link className="atelier-link" to="/journal">{editor.content.journalCta}</Link></p>}
      </section>

      <div className="atelier-reviews atelier-wrap"><ReviewsSection /></div>
    </div>
  )
}
export default HomePage
