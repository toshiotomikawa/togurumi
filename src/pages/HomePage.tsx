import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowIcon, Branch, CartIcon, CrownIcon, GemIcon, GiftIcon, HandHeartIcon, HeartIcon, OrnamentRule, SprigIcon } from '../components/AtelierIcons'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ReviewsSection from '../components/ReviewsSection'
import { useCart } from '../hooks/useCart'
import { useEditableContent } from '../hooks/useEditableContent'
import { useFavorites } from '../hooks/useFavorites'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, parseProductColors, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'

const copy = {
  'pt-BR': {
    benefits: [
      ['Feito à mão', 'Cada peça é crochetada pela Bella, ponto a ponto.'],
      ['Fio chenille macio', 'Pelúcia fofinha e aveludada ao toque.'],
      ['Poucas unidades', 'Cada modelo sai em pequenas quantidades.'],
      ['Presente perfeito', 'Um mimo especial para quem você ama.'],
    ],
    collection: 'Nossa coleção', viewAll: 'Ver coleção completa', kind: 'Amigurumi artesanal',
    favorite: 'Favoritar', unfavorite: 'Tirar dos favoritos', add: 'Adicionar ao carrinho', added: 'Adicionado ao carrinho', choose: 'Escolher cor', soldOut: 'Esgotado',
    lastTitle: 'Últimas unidades', lastIntro: 'Peças com poucas unidades no ateliê. Quando acabam, dá para pedir por encomenda.', lastCta: 'Comprar agora',
    left: (n: number) => (n === 1 ? 'Resta 1' : `Restam ${n}`),
  },
  'en-US': {
    benefits: [
      ['Made by hand', 'Every piece is crocheted by Bella, stitch by stitch.'],
      ['Soft chenille yarn', 'Plush, velvety and cosy to hold.'],
      ['Small batches', 'Each design is made in small quantities.'],
      ['The perfect gift', 'A special treat for someone you love.'],
    ],
    collection: 'Our collection', viewAll: 'View the full collection', kind: 'Handmade amigurumi',
    favorite: 'Add to favorites', unfavorite: 'Remove from favorites', add: 'Add to cart', added: 'Added to cart', choose: 'Choose a color', soldOut: 'Sold out',
    lastTitle: 'Last pieces', lastIntro: 'Pieces with only a few left in the studio. Once they are gone, you can ask for a custom order.', lastCta: 'Shop now',
    left: (n: number) => `${n} left`,
  },
  'es-ES': {
    benefits: [
      ['Hecho a mano', 'Cada pieza la teje Bella, punto a punto.'],
      ['Hilo chenille suave', 'Peluche esponjoso y aterciopelado al tacto.'],
      ['Pocas unidades', 'Cada modelo sale en pequeñas cantidades.'],
      ['Regalo perfecto', 'Un detalle especial para quien quieres.'],
    ],
    collection: 'Nuestra colección', viewAll: 'Ver la colección completa', kind: 'Amigurumi artesanal',
    favorite: 'Añadir a favoritos', unfavorite: 'Quitar de favoritos', add: 'Añadir al carrito', added: 'Añadido al carrito', choose: 'Elegir color', soldOut: 'Agotado',
    lastTitle: 'Últimas unidades', lastIntro: 'Piezas con pocas unidades en el taller. Cuando se acaban, puedes pedirlas por encargo.', lastCta: 'Comprar ahora',
    left: (n: number) => (n === 1 ? 'Queda 1' : `Quedan ${n}`),
  },
}

const benefitIcons = [HandHeartIcon, YarnIcon, GemIcon, GiftIcon]

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
          {soldOut ? <span className="atelier-card__cart is-disabled" aria-label={t.soldOut} role="img"><CartIcon /></span>
            : colors.length > 1 ? <Link className="atelier-card__cart" to={href} aria-label={`${t.choose}: ${product.name}`}><CartIcon /></Link>
            : <button type="button" className={`atelier-card__cart${added ? ' is-added' : ''}`} aria-label={`${added ? t.added : t.add}: ${product.name}`} onClick={() => { addItem({ slug, name: product.name, price: product.price, color: colors[0] }); setAdded(true) }}><CartIcon /></button>}
        </div>
      </div>
    </article>
  )
}

function HomePage() {
  const { messages, locale } = useLocale()
  const t = copy[locale]
  const { products, loaded } = useShopProducts()
  const editor = useEditableContent('home', locale, messages.home, messages.contentEditor.draftRestored)
  const photographed = products.filter(product => product.image)
  const available = photographed.filter(product => product.stock > 0)
  const selected = [...available.filter(product => product.highlight), ...available.filter(product => !product.highlight)].slice(0, 8)
  const heroPieces = [
    ...HERO_PREFERRED.map(slug => photographed.find(product => slugify(product.name) === slug)).filter((product): product is ShopProduct => Boolean(product)),
    ...photographed.filter(product => !HERO_PREFERRED.includes(slugify(product.name))),
  ].slice(0, 3)
  const lastPieces = [...available].sort((a, b) => a.stock - b.stock).slice(0, 4)

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
            <h1 id="home-title">{editor.content.title}</h1>
            <OrnamentRule kind="heart" className="atelier-hero__rule" />
            <p>{editor.content.intro}</p>
            <Link className="atelier-button" to="/shop">{editor.content.shopCta}<ArrowIcon /></Link>
          </div>
        </div>
      </section>}

      {editor.canEdit && <div className="atelier-wrap"><EditActions editLabel={messages.contentEditor.editButton} saveLabel={messages.contentEditor.save} cancelLabel={messages.contentEditor.cancel} editing={editor.editing} saving={editor.saving} onEdit={editor.startEditing} onSave={() => void editor.save(messages.contentEditor)} onCancel={editor.cancelEditing} /></div>}
      <div className="atelier-wrap"><EditFeedback feedback={editor.feedback} /></div>

      <ul className="atelier-benefits atelier-wrap">
        {t.benefits.map(([title, text], index) => {
          const Icon = benefitIcons[index]
          return <li key={title}><Icon className="atelier-benefits__icon" /><div><h2>{title}</h2><p>{text}</p></div></li>
        })}
      </ul>

      <section className="atelier-collection atelier-wrap atelier-wrap--wide" aria-labelledby="collection-title">
        <div className="atelier-heading">
          <h2 id="collection-title"><SprigIcon className="atelier-heading__sprig" />{t.collection}</h2>
          <Link className="atelier-link" to="/shop">{t.viewAll}<ArrowIcon /></Link>
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
            {product.stock <= 3 && <span className="atelier-band__badge">★ {t.left(product.stock)}</span>}
          </Link>)}
        </div>
      </section>}

      <div className="atelier-reviews atelier-wrap"><ReviewsSection /></div>
    </div>
  )
}
export default HomePage
