import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, getColorSwatch, parseProductColors } from '../lib/shop'
import { slugify } from '../lib/slug'
import NotFoundPage from './NotFoundPage'

function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { messages, locale } = useLocale()
  const { addItem } = useCart()
  const { products, loaded } = useShopProducts()
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')

  if (!loaded) return null

  const product = products.find((item) => slugify(item.name) === slug)
  if (!product) return <NotFoundPage />

  const availableColors = parseProductColors(product.cores)
  const activeColor = availableColors.includes(selectedColor) ? selectedColor : availableColors[0]
  const activeImage = (activeColor && product.imagesByColor[activeColor]) || product.image

  function handleAddToCart() {
    if (!product) return
    addItem({
      slug: slugify(product.name),
      name: product.name,
      price: product.price,
      color: activeColor,
    })
    setAdded(true)
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setAdded(false)
  }

  return (
    <div className="page page--narrow">
      <Link to="/shop" className="back-link">
        {messages.shop.backLink}
      </Link>
      <article className="product-detail">
        {activeImage ? (
          <img className="product-detail__image" src={activeImage} alt={product.name} />
        ) : (
          <div className="product-detail__image product-detail__image--placeholder" aria-hidden="true" />
        )}
        <span className="product-card__category">{product.category}</span>
        <h1>{product.name}</h1>
        {product.designer && <p className="product-detail__designer">{messages.shop.designerLabel}: {product.designer}</p>}
        {product.description && <p>{product.description}</p>}
        {product.yarn && (
          <p>
            <strong>{messages.shop.yarnLabel}:</strong> {product.yarn}
          </p>
        )}
        {availableColors.length > 0 ? (
          <fieldset className="product-color-picker">
            <legend>{messages.shop.chooseColorLabel}</legend>
            <div className="product-color-picker__swatches">
              {availableColors.map((color) => (
                <button
                  type="button"
                  className={`color-swatch${activeColor === color ? ' color-swatch--selected' : ''}`}
                  style={{ backgroundColor: getColorSwatch(color) }}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`${messages.shop.chooseColorLabel}: ${color}`}
                  aria-pressed={activeColor === color}
                  title={color}
                  key={color}
                />
              ))}
            </div>
            <span className="product-color-picker__selection">
              <strong>{messages.shop.selectedColorLabel}:</strong> {activeColor}
            </span>
          </fieldset>
        ) : product.cores ? (
          <p>
            <strong>{messages.shop.coresLabel}:</strong> {product.cores}
          </p>
        ) : null}
        <div className="product-detail__footer">
          <span className="product-card__price">{formatPrice(product.price, locale)}</span>
          <span className="product-card__stock">
            {product.stock > 0 ? `${messages.shop.stockLabel}: ${product.stock}` : messages.shop.outOfStock}
          </span>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {added ? messages.shop.addedToCart : messages.shop.addToCart}
        </button>
      </article>
    </div>
  )
}

export default ProductPage
