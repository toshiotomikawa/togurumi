import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BoxIcon, CartIcon, HandIcon, HeartIcon, LeafIcon, MinusIcon, OrnamentRule, PlusIcon, SealIcon, SprigIcon } from '../components/AtelierIcons'
import { useCart } from '../hooks/useCart'
import { useFavorites } from '../hooks/useFavorites'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, getColorSwatch, isRecentlyReleased, parseProductColors } from '../lib/shop'
import { slugify } from '../lib/slug'
import NotFoundPage from './NotFoundPage'

const copy = {
  'pt-BR': {
    seal: ['Feito', 'à mão', 'com amor'], handmade: 'Feito à mão', handmadeNote: 'Peça artesanal', yarnNote: 'Macio e fofinho',
    available: 'Disponível', availableNote: (n: number) => (n === 1 ? 'Última unidade' : `${n} unidades`), soldOutNote: 'Sob encomenda',
    quantity: 'Quantidade', decrease: 'Diminuir quantidade', increase: 'Aumentar quantidade',
    quote: '一点もののやさしさ。', quoteNote: 'A delicadeza de uma peça única.', fallback: (yarn: string) => `Feito à mão em fio ${yarn.toLowerCase()}, ponto a ponto, para ser abraçado.`,
    favorite: 'Adicionar aos favoritos', favorited: 'Nos seus favoritos', photos: 'Fotos da peça', photo: (color: string) => `Ver foto: ${color}`, details: 'Detalhes da peça',
  },
  'en-US': {
    seal: ['Made', 'by hand', 'with love'], handmade: 'Made by hand', handmadeNote: 'Handcrafted piece', yarnNote: 'Soft and fluffy',
    available: 'Available', availableNote: (n: number) => (n === 1 ? 'Last one' : `${n} in stock`), soldOutNote: 'Custom order',
    quantity: 'Quantity', decrease: 'Decrease quantity', increase: 'Increase quantity',
    quote: '一点もののやさしさ。', quoteNote: 'The gentleness of a one-of-a-kind piece.', fallback: (yarn: string) => `Made by hand in ${yarn.toLowerCase()} yarn, stitch by stitch, to be hugged.`,
    favorite: 'Add to favorites', favorited: 'In your favorites', photos: 'Product photos', photo: (color: string) => `View photo: ${color}`, details: 'Piece details',
  },
  'es-ES': {
    seal: ['Hecho', 'a mano', 'con amor'], handmade: 'Hecho a mano', handmadeNote: 'Pieza artesanal', yarnNote: 'Suave y esponjoso',
    available: 'Disponible', availableNote: (n: number) => (n === 1 ? 'Última unidad' : `${n} unidades`), soldOutNote: 'Por encargo',
    quantity: 'Cantidad', decrease: 'Reducir cantidad', increase: 'Aumentar cantidad',
    quote: '一点もののやさしさ。', quoteNote: 'La delicadeza de una pieza única.', fallback: (yarn: string) => `Hecho a mano en hilo ${yarn.toLowerCase()}, punto a punto, para abrazar.`,
    favorite: 'Añadir a favoritos', favorited: 'En tus favoritos', photos: 'Fotos de la pieza', photo: (color: string) => `Ver foto: ${color}`, details: 'Detalles de la pieza',
  },
}

function ProductImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="product-detail__image product-detail__image--placeholder" role="img" aria-label={label}>
      <span className="product-detail__placeholder-yarn" aria-hidden="true" />
      <span className="product-detail__placeholder-label">{label}</span>
    </div>
  )
}

function ProductDetailSkeleton({ label }: { label: string }) {
  return (
    <div className="page page--product atelier-product" aria-busy="true" aria-live="polite" aria-label={label}>
      <div className="product-detail product-detail--skeleton" aria-hidden="true">
        <div className="product-detail__media">
          <div className="product-detail__image product-detail__skeleton-block" />
        </div>
        <div className="product-detail__info">
          <div className="product-detail__skeleton-line product-detail__skeleton-line--xs" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--title" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--price" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--md" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--lg" />
          <div className="product-detail__skeleton-line product-detail__skeleton-line--md" />
          <div className="product-detail__skeleton-cta" />
        </div>
      </div>
    </div>
  )
}

function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const t = copy[locale]
  const { addItem } = useCart()
  const { isFavorite, toggle } = useFavorites()
  const { products, loaded } = useShopProducts()
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState(slug)

  // Reset ephemeral UI when navigating between product slugs (React "adjust state while rendering").
  if (slug !== activeSlug) {
    setActiveSlug(slug)
    setAdded(false)
    setSelectedColor('')
    setQuantity(1)
    setFailedImageSrc(null)
  }

  if (!loaded) {
    return <ProductDetailSkeleton label={messages.shop.loadingLabel} />
  }

  const found = products.find((item) => slugify(item.name) === slug)
  if (!found) return <NotFoundPage />

  const product = found
  const availableColors = parseProductColors(product.cores)
  const activeColor = availableColors.includes(selectedColor) ? selectedColor : availableColors[0]
  const activeImage = (activeColor && product.imagesByColor[activeColor]) || product.image
  const showImage = Boolean(activeImage) && failedImageSrc !== activeImage
  const soldOut = product.stock <= 0
  const isNew = isRecentlyReleased(product.releaseDate)
  const productSlug = slugify(product.name)
  const maxQuantity = Math.max(1, product.stock)
  const thumbs = availableColors
    .map((color) => ({ color, src: product.imagesByColor[color] }))
    .filter((thumb, index, list): thumb is { color: string; src: string } => Boolean(thumb.src) && list.findIndex((other) => other.src === thumb.src) === index)

  function handleAddToCart() {
    if (soldOut) return
    addItem({
      slug: productSlug,
      name: product.name,
      price: product.price,
      color: activeColor,
    }, Math.min(quantity, maxQuantity))
    setAdded(true)
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setAdded(false)
  }

  function changeQuantity(delta: number) {
    setQuantity((current) => Math.min(maxQuantity, Math.max(1, current + delta)))
    setAdded(false)
  }

  function handleImageError() {
    if (activeImage) setFailedImageSrc(activeImage)
  }

  return (
    <div className="page page--product atelier-product">
      <article className={`product-detail${soldOut ? ' product-detail--sold-out' : ''}`}>
        <div className="product-detail__media">
          <div className="product-detail__frame">
            {showImage ? (
              <img
                className="product-detail__image"
                src={activeImage}
                alt={product.name}
                onError={handleImageError}
              />
            ) : (
              <ProductImagePlaceholder label={messages.shop.photoComingSoon} />
            )}
            <span className="product-detail__seal" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs><path id="seal-arc" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" /></defs>
                <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 4" />
                <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="product-detail__seal-words">
                <small>{t.seal[0]}</small><strong>{t.seal[1]}</strong><small>{t.seal[2]}</small>
              </span>
            </span>
            {soldOut ? <span className="product-detail__sold-out-badge">{messages.shop.outOfStock}</span> : null}
          </div>
          {thumbs.length > 1 ? (
            <div className="product-detail__thumbs" role="group" aria-label={t.photos}>
              {thumbs.map((thumb) => (
                <button
                  type="button"
                  key={thumb.color}
                  className={`product-detail__thumb${thumb.src === activeImage ? ' is-active' : ''}`}
                  onClick={() => handleColorSelect(thumb.color)}
                  aria-label={t.photo(thumb.color)}
                  aria-pressed={thumb.src === activeImage}
                >
                  <img src={thumb.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-detail__info">
          <p className="product-detail__kana" lang="ja">
            <SprigIcon className="product-detail__sprig" />
            <span>手づくりのぬいぐるみ</span>
            <SprigIcon className="product-detail__sprig product-detail__sprig--flip" />
          </p>

          <h1 className="product-detail__title">{product.name}</h1>
          {isNew ? <span className="product-detail__badge">{messages.shop.newBadge}</span> : null}
          <OrnamentRule kind="star" className="product-detail__rule" />

          <p className="product-detail__price">{formatPrice(product.price, locale)}</p>
          <p className="product-detail__description">{product.description || t.fallback(product.yarn || 'chenille')}</p>

          <ul className="product-detail__attrs">
            <li><LeafIcon /><span><strong>{product.yarn ? `${messages.shop.yarnLabel} ${product.yarn.toLowerCase()}` : t.handmadeNote}</strong><small>{t.yarnNote}</small></span></li>
            <li><HandIcon /><span><strong>{t.handmade}</strong><small>{t.handmadeNote}</small></span></li>
            <li><BoxIcon /><span><strong>{soldOut ? messages.shop.outOfStock : t.available}</strong><small>{soldOut ? t.soldOutNote : t.availableNote(product.stock)}</small></span></li>
          </ul>

          {availableColors.length > 0 ? (
            <fieldset className="product-color-picker">
              <legend>{messages.shop.chooseColorLabel}</legend>
              <div className="product-color-picker__swatches">
                {availableColors.map((color) => {
                  const selected = activeColor === color
                  return (
                    <button
                      type="button"
                      className={`color-swatch${selected ? ' color-swatch--selected' : ''}`}
                      style={{ backgroundColor: getColorSwatch(color) }}
                      onClick={() => handleColorSelect(color)}
                      aria-label={`${messages.shop.chooseColorLabel}: ${color}`}
                      aria-pressed={selected}
                      title={color}
                      key={color}
                    >
                      <span className="color-swatch__check" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
              <span className="product-color-picker__selection">
                <strong>{messages.shop.selectedColorLabel}:</strong> {activeColor}
              </span>
            </fieldset>
          ) : null}

          <div className="product-detail__actions">
            <div className="product-qty" role="group" aria-label={t.quantity}>
              <button type="button" onClick={() => changeQuantity(-1)} disabled={soldOut || quantity <= 1} aria-label={t.decrease}><MinusIcon /></button>
              <output aria-live="polite">{soldOut ? 0 : quantity}</output>
              <button type="button" onClick={() => changeQuantity(1)} disabled={soldOut || quantity >= maxQuantity} aria-label={t.increase}><PlusIcon /></button>
            </div>
            <button
              type="button"
              className={`button button--primary product-detail__cta${added ? ' product-detail__cta--added' : ''}`}
              onClick={handleAddToCart}
              disabled={soldOut}
            >
              <CartIcon />
              {soldOut ? messages.shop.outOfStock : added ? messages.shop.addedToCart : messages.shop.addToCart}
            </button>
          </div>
          <p className="product-detail__cart-status" role="status" aria-live="polite">
            {added && !soldOut ? messages.shop.addedToCart : null}
          </p>
          <button type="button" className={`product-detail__fav${isFavorite(productSlug) ? ' is-on' : ''}`} aria-pressed={isFavorite(productSlug)} onClick={() => toggle(productSlug)}>
            <HeartIcon />{isFavorite(productSlug) ? t.favorited : t.favorite}
          </button>

          <figure className="product-detail__quote">
            <span className="product-detail__quote-icon"><SealIcon /></span>
            <blockquote lang="ja">{t.quote}</blockquote>
            <figcaption>{t.quoteNote}</figcaption>
          </figure>

          <dl className="product-detail__specs" aria-label={t.details}>
            {product.yarn ? <div className="product-detail__spec"><dt>{messages.shop.yarnLabel}</dt><dd>{product.yarn}</dd></div> : null}
            {product.cores && availableColors.length === 0 ? <div className="product-detail__spec"><dt>{messages.shop.coresLabel}</dt><dd>{product.cores}</dd></div> : null}
            {product.designer ? <div className="product-detail__spec"><dt>{messages.shop.designerLabel}</dt><dd>{product.designer}</dd></div> : null}
            {product.category ? <div className="product-detail__spec"><dt>{messages.shop.eyebrow}</dt><dd>{product.category}</dd></div> : null}
          </dl>

          {messages.shop.deliveryNotice ? (
            <p className="product-detail__delivery">{messages.shop.deliveryNotice}</p>
          ) : null}
        </div>
      </article>
    </div>
  )
}

export default ProductPage
