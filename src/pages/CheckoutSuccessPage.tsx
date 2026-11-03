import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocale } from '../hooks/useLocale'
import { fetchCheckoutStatus, type CheckoutStatus } from '../lib/checkout'

const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 24

type ViewState = CheckoutStatus | 'checking' | 'unknown'

function CheckoutSuccessPage() {
  const { messages } = useLocale()
  const { clearCart } = useCart()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') ?? ''
  const [state, setState] = useState<ViewState>(sessionId ? 'checking' : 'unknown')

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let polls = 0
    let timer: number | undefined

    async function check() {
      const status = await fetchCheckoutStatus(sessionId)
      if (cancelled) return
      polls += 1

      if (status === 'paid' || status === 'pending') clearCart()
      if (status === 'pending' && polls < MAX_POLLS) {
        timer = window.setTimeout(check, POLL_INTERVAL_MS)
      }
      setState(status === null || status === 'open' || status === 'expired' ? 'unknown' : status)
    }

    void check()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // clearCart is recreated with the cart; polling should follow the session id only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const copy = {
    checking: [messages.checkout.checkingTitle, messages.checkout.checkingBody],
    paid: [messages.checkout.paidTitle, messages.checkout.paidBody],
    pending: [messages.checkout.pendingTitle, messages.checkout.pendingBody],
    failed: [messages.checkout.failedTitle, messages.checkout.failedBody],
    unknown: [messages.checkout.unknownTitle, messages.checkout.unknownBody],
    open: [messages.checkout.unknownTitle, messages.checkout.unknownBody],
    expired: [messages.checkout.unknownTitle, messages.checkout.unknownBody],
  }[state]

  return (
    <div className="page page--checkout">
      <section className={`checkout-result checkout-result--${state}`} aria-live="polite">
        <span className="checkout-result__eyebrow">{messages.checkout.successEyebrow}</span>
        <h1 className="checkout-result__title">{copy[0]}</h1>
        <p className="checkout-result__body">{copy[1]}</p>
        <p className="checkout-result__body">{messages.shop.deliveryNotice}</p>
        <div className="checkout-result__actions">
          {state === 'failed' ? (
            <Link to="/cart" className="button button--primary">
              {messages.checkout.backToCart}
            </Link>
          ) : null}
          <Link to="/shop" className={state === 'failed' ? 'button' : 'button button--primary'}>
            {messages.cart.continueShopping}
          </Link>
        </div>
      </section>
    </div>
  )
}

export default CheckoutSuccessPage
