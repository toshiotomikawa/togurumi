import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { formatPrice, getColorSwatch } from '../lib/shop'

function CartPage() {
  const { messages, locale } = useLocale()
  const { items, removeItem, updateQuantity } = useCart()

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="page page--narrow">
      <section className="hero">
        <span className="hero__eyebrow">{messages.cart.eyebrow}</span>
        <h1>{messages.cart.title}</h1>
      </section>

      <section className="section">
        {items.length > 0 ? (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <div className="cart-item" key={`${item.slug}:${item.color ?? ''}`}>
                  <div className="cart-item__details">
                    <Link to={`/shop/${item.slug}`} className="cart-item__name">
                      {item.name}
                    </Link>
                    {item.color && (
                      <span className="cart-item__color">
                        <span
                          className="cart-item__color-swatch"
                          style={{ backgroundColor: getColorSwatch(item.color) }}
                          aria-hidden="true"
                        />
                        {messages.shop.selectedColorLabel}: {item.color}
                      </span>
                    )}
                  </div>
                  <div className="cart-item__quantity">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.slug, item.quantity - 1, item.color)}
                      aria-label="-"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.slug, item.quantity + 1, item.color)}
                      aria-label="+"
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-item__price">{formatPrice(item.price * item.quantity, locale)}</span>
                  <button
                    type="button"
                    className="cart-item__remove"
                    onClick={() => removeItem(item.slug, item.color)}
                  >
                    {messages.cart.remove}
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>{messages.cart.total}</span>
              <strong>{formatPrice(total, locale)}</strong>
            </div>
            <p className="cart-note">{messages.shop.deliveryNotice}</p>
            <p className="cart-note">{messages.cart.checkoutNote}</p>
          </>
        ) : (
          <>
            <p>{messages.cart.empty}</p>
            <Link to="/shop" className="button button--primary">
              {messages.cart.continueShopping}
            </Link>
          </>
        )}
      </section>
    </div>
  )
}

export default CartPage
