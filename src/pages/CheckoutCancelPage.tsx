import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'

function CheckoutCancelPage() {
  const { messages } = useLocale()

  return (
    <div className="page page--checkout">
      <section className="checkout-result checkout-result--cancelled">
        <span className="checkout-result__eyebrow">{messages.checkout.cancelEyebrow}</span>
        <h1 className="checkout-result__title">{messages.checkout.cancelTitle}</h1>
        <p className="checkout-result__body">{messages.checkout.cancelBody}</p>
        <div className="checkout-result__actions">
          <Link to="/cart" className="button button--primary">
            {messages.checkout.backToCart}
          </Link>
          <Link to="/shop" className="button">
            {messages.cart.continueShopping}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default CheckoutCancelPage
