import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useShopProducts } from '../hooks/useShopProducts'
import { useLocale } from '../hooks/useLocale'
import {
  CheckoutRequestError,
  fetchShippingStatus,
  requestShippingQuote,
  startCheckout,
  type ShippingQuote,
} from '../lib/checkout'
import { formatPrice, getColorSwatchBackground } from '../lib/shop'
import { slugify } from '../lib/slug'
import type { CartItem } from '../context/cart'

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function itemKey(item: Pick<CartItem, 'slug' | 'color'>) {
  return `${item.slug}:${item.color ?? ''}`
}

function CartPage() {
  const { messages, locale } = useLocale()
  const { items, itemCount, removeItem, updateQuantity } = useCart()
  const { products } = useShopProducts()
  const [statusMessage, setStatusMessage] = useState('')
  const [checkoutPending, setCheckoutPending] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [shippingEnabled, setShippingEnabled] = useState(false)
  const [cep, setCep] = useState('')
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [quotePending, setQuotePending] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    let active = true
    void fetchShippingStatus().then((status) => {
      if (active) setShippingEnabled(status.enabled)
    })
    return () => {
      active = false
    }
  }, [])

  // Show the current catalog price when it is loaded; the server recalculates it at checkout anyway.
  const priceOf = (item: CartItem) =>
    products.find((entry) => slugify(entry.name) === item.slug)?.price ?? item.price
  const total = items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0)
  const lineCount = items.length
  const selectedOption = quote?.options.find((option) => option.id === selectedOptionId) ?? null
  const shippingAmount = selectedOption ? selectedOption.amountCents / 100 : 0
  const orderTotal = total + shippingAmount

  function resetShipping() {
    setQuote(null)
    setSelectedOptionId('')
    setQuoteError('')
  }

  function announce(message: string) {
    // A cart change makes the previous checkout error stale.
    setCheckoutError('')
    // Retrigger polite live region when the same text is set again.
    setStatusMessage('')
    requestAnimationFrame(() => setStatusMessage(message))
  }

  function handleDecrease(item: CartItem) {
    const next = item.quantity - 1
    updateQuantity(item.slug, next, item.color)
    resetShipping()
    if (next <= 0) {
      announce(fillTemplate(messages.cart.removedFeedback, { name: item.name }))
    } else {
      announce(
        fillTemplate(messages.cart.quantityDecreasedFeedback, {
          name: item.name,
          quantity: next,
        }),
      )
    }
  }

  function handleIncrease(item: CartItem) {
    const next = item.quantity + 1
    updateQuantity(item.slug, next, item.color)
    resetShipping()
    announce(
      fillTemplate(messages.cart.quantityIncreasedFeedback, {
        name: item.name,
        quantity: next,
      }),
    )
  }

  function checkoutErrorMessage(error: unknown) {
    const failure = error instanceof CheckoutRequestError ? error.failure : { error: 'checkout_failed' }
    const name = items.find((item) => item.slug === failure.slug)?.name ?? ''
    switch (failure.error) {
      case 'product_unavailable':
        return fillTemplate(messages.checkout.errorUnavailable, { name })
      case 'insufficient_stock':
        return fillTemplate(messages.checkout.errorInsufficientStock, { name, available: failure.available ?? 0 })
      case 'invalid_color':
        return fillTemplate(messages.checkout.errorInvalidColor, { name })
      case 'invalid_cart':
        return messages.checkout.errorInvalidCart
      case 'checkout_unavailable':
        return messages.checkout.errorNotConfigured
      case 'too_many_attempts':
        return messages.checkout.errorTooMany
      case 'shipping_required':
        return messages.checkout.errorShippingRequired
      case 'shipping_quote_invalid':
        return messages.checkout.errorShippingExpired
      case 'shipping_disabled':
      case 'quote_unavailable':
      case 'shipping_failed':
        return messages.checkout.errorShippingUnavailable
      case 'invalid_cep':
        return messages.checkout.errorInvalidCep
      default:
        return messages.checkout.errorGeneric
    }
  }

  function shippingErrorMessage(error: unknown) {
    const failure = error instanceof CheckoutRequestError ? error.failure : { error: 'shipping_failed' }
    switch (failure.error) {
      case 'invalid_cep':
        return messages.checkout.errorInvalidCep
      case 'too_many_attempts':
        return messages.checkout.errorTooMany
      case 'outside_area':
        return messages.checkout.outsideArea
      case 'product_unavailable':
      case 'insufficient_stock':
      case 'invalid_color':
      case 'invalid_cart':
        return checkoutErrorMessage(error)
      default:
        return messages.checkout.errorShippingUnavailable
    }
  }

  async function handleQuote() {
    if (quotePending || items.length === 0) return
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      setQuoteError(messages.checkout.errorInvalidCep)
      return
    }
    setQuotePending(true)
    setQuoteError('')
    setQuote(null)
    setSelectedOptionId('')
    try {
      const result = await requestShippingQuote(digits, items)
      if (!result.served) {
        setQuoteError(messages.checkout.outsideArea)
        return
      }
      setQuote({ quoteId: result.quoteId, options: result.options, estimated: result.estimated })
      setSelectedOptionId(result.options[0]?.id ?? '')
    } catch (error) {
      setQuoteError(shippingErrorMessage(error))
    } finally {
      setQuotePending(false)
    }
  }

  async function handleCheckout() {
    if (checkoutPending || items.length === 0) return
    if (shippingEnabled && !selectedOption) {
      setCheckoutError(messages.checkout.errorShippingRequired)
      return
    }
    setCheckoutPending(true)
    setCheckoutError('')
    try {
      const url = await startCheckout(
        items,
        locale,
        selectedOption && quote ? { quoteId: quote.quoteId, optionId: selectedOption.id } : undefined,
      )
      window.location.assign(url)
    } catch (error) {
      setCheckoutError(checkoutErrorMessage(error))
      setCheckoutPending(false)
    }
  }

  function handleRemove(item: CartItem) {
    removeItem(item.slug, item.color)
    resetShipping()
    announce(fillTemplate(messages.cart.removedFeedback, { name: item.name }))
  }

  const countLabel =
    itemCount === 1
      ? messages.cart.itemCountOne
      : fillTemplate(messages.cart.itemCountMany, { count: itemCount })

  const linesLabel =
    lineCount === 1
      ? messages.cart.linesOne
      : fillTemplate(messages.cart.linesMany, { count: lineCount })

  return (
    <div className="page page--cart">
      <section className="cart-hero">
        <span className="cart-hero__eyebrow">{messages.cart.eyebrow}</span>
        <div className="cart-hero__heading">
          <h1 className="cart-hero__title">{messages.cart.title}</h1>
          {items.length > 0 ? (
            <p className="cart-hero__count" role="status" aria-live="polite">
              {countLabel}
            </p>
          ) : null}
        </div>
        <p className="cart-hero__intro">{messages.cart.intro}</p>
        <Link to="/shop" className="cart-hero__continue">
          {messages.cart.continueShopping}
        </Link>
      </section>

      <div className="cart-status" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      {items.length === 0 ? (
        <section className="cart-empty" aria-labelledby="cart-empty-title">
          <span className="cart-empty__deco" aria-hidden="true" />
          <h2 id="cart-empty-title" className="cart-empty__title">
            {messages.cart.emptyTitle}
          </h2>
          <p className="cart-empty__body">{messages.cart.emptyBody}</p>
          <Link to="/shop" className="button button--primary">
            {messages.cart.continueShopping}
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-main" aria-label={messages.cart.ariaLabel}>
            <ul className="cart-list">
              {items.map((item) => {
                const product = products.find((entry) => slugify(entry.name) === item.slug)
                const image = (item.color && product?.imagesByColor[item.color]) || product?.image
                const unitPrice = priceOf(item)
                const lineTotal = unitPrice * item.quantity
                const decreaseLabel = fillTemplate(messages.cart.decreaseQuantity, {
                  name: item.name,
                })
                const increaseLabel = fillTemplate(messages.cart.increaseQuantity, {
                  name: item.name,
                })
                const removeLabel = fillTemplate(messages.cart.removeItem, {
                  name: item.name,
                })
                const quantityLabel = fillTemplate(messages.cart.quantityLabel, {
                  name: item.name,
                  quantity: item.quantity,
                })

                return (
                  <li className="cart-item" key={itemKey(item)}>
                    {image && <img className="cart-item__photo" src={image} alt="" loading="lazy" />}
                    <div className="cart-item__details">
                      <Link to={`/shop/${item.slug}`} className="cart-item__name">
                        {item.name}
                      </Link>
                      {item.color ? (
                        <p className="cart-item__color">
                          <span
                            className="cart-item__color-swatch"
                            style={{ background: getColorSwatchBackground(item.color) }}
                            aria-hidden="true"
                          />
                          <span>
                            {messages.shop.selectedColorLabel}: {item.color}
                          </span>
                        </p>
                      ) : null}
                      <p className="cart-item__unit">
                        {fillTemplate(messages.cart.unitPrice, {
                          price: formatPrice(unitPrice, locale),
                        })}
                      </p>
                    </div>

                    <div className="cart-item__controls">
                      <div
                        className="cart-item__quantity"
                        role="group"
                        aria-label={quantityLabel}
                      >
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() => handleDecrease(item)}
                          aria-label={decreaseLabel}
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <span className="cart-item__qty-value" aria-hidden="true">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-item__qty-btn"
                          onClick={() => handleIncrease(item)}
                          aria-label={increaseLabel}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>

                      <p className="cart-item__line-total">
                        <span className="visually-hidden">
                          {fillTemplate(messages.cart.lineSubtotal, {
                            price: formatPrice(lineTotal, locale),
                          })}
                        </span>
                        <span aria-hidden="true">{formatPrice(lineTotal, locale)}</span>
                      </p>

                      <button
                        type="button"
                        className="cart-item__remove"
                        onClick={() => handleRemove(item)}
                        aria-label={removeLabel}
                      >
                        <span aria-hidden="true">×</span>
                        <span className="cart-item__remove-text">{messages.cart.remove}</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <aside className="cart-summary" aria-labelledby="cart-summary-title">
            <div className="cart-summary__panel">
              <h2 id="cart-summary-title" className="cart-summary__title">
                {messages.cart.summaryTitle}
              </h2>

              {shippingEnabled ? (
                <div className="cart-shipping">
                  <p className="cart-shipping__title">{messages.checkout.shippingTitle}</p>
                  <div className="cart-shipping__field">
                    <label htmlFor="cart-cep" className="cart-shipping__label visually-hidden">
                      {messages.checkout.cepLabel}
                    </label>
                    <input
                      id="cart-cep"
                      className="cart-shipping__input"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={9}
                      placeholder={messages.checkout.cepPlaceholder}
                      value={cep}
                      onChange={(event) => {
                        setCep(event.target.value)
                        resetShipping()
                      }}
                    />
                    <button
                      type="button"
                      className="button cart-shipping__quote"
                      onClick={handleQuote}
                      disabled={quotePending}
                      aria-busy={quotePending}
                    >
                      {quotePending ? messages.checkout.quoting : messages.checkout.quoteButton}
                    </button>
                  </div>
                  {quoteError ? (
                    <p className="cart-shipping__error" role="alert">{quoteError}</p>
                  ) : null}
                  {quote ? (
                    <fieldset className="cart-shipping__options">
                      <legend className="visually-hidden">{messages.checkout.selectShipping}</legend>
                      {quote.options.map((option) => (
                        <label className="cart-shipping__option" key={option.id}>
                          <input
                            type="radio"
                            name="shipping-option"
                            value={option.id}
                            checked={selectedOptionId === option.id}
                            onChange={() => setSelectedOptionId(option.id)}
                          />
                          <span className="cart-shipping__option-name">
                            {option.pickup ? messages.checkout.pickupOption : option.label}
                          </span>
                          <span className="cart-shipping__option-price">
                            {option.pickup ? messages.checkout.free : formatPrice(option.amountCents / 100, locale)}
                          </span>
                          {option.minDays !== null && option.maxDays !== null ? (
                            <span className="cart-shipping__option-days">
                              {option.minDays === option.maxDays
                                ? fillTemplate(messages.checkout.shippingDays, { days: option.minDays })
                                : fillTemplate(messages.checkout.shippingDaysRange, { min: option.minDays, max: option.maxDays })}
                            </span>
                          ) : null}
                        </label>
                      ))}
                    </fieldset>
                  ) : null}
                  {quote?.estimated ? (
                    <p className="cart-shipping__estimated">{messages.checkout.shippingEstimated}</p>
                  ) : null}
                </div>
              ) : null}

              <dl className="cart-summary__rows">
                <div className="cart-summary__row">
                  <dt>{messages.cart.unitsLabel}</dt>
                  <dd>
                    <span role="status" aria-live="polite">
                      {countLabel}
                    </span>
                  </dd>
                </div>
                <div className="cart-summary__row">
                  <dt>{messages.cart.linesLabel}</dt>
                  <dd>{linesLabel}</dd>
                </div>
                {shippingEnabled ? (
                  <div className="cart-summary__row">
                    <dt>{messages.checkout.shipping}</dt>
                    <dd>
                      {selectedOption
                        ? selectedOption.pickup
                          ? messages.checkout.free
                          : formatPrice(selectedOption.amountCents / 100, locale)
                        : '—'}
                    </dd>
                  </div>
                ) : null}
                <div className="cart-summary__row cart-summary__row--total">
                  <dt>{messages.cart.total}</dt>
                  <dd>
                    <strong role="status" aria-live="polite">
                      {formatPrice(orderTotal, locale)}
                    </strong>
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="button button--primary cart-summary__checkout"
                onClick={handleCheckout}
                disabled={checkoutPending}
                aria-busy={checkoutPending}
              >
                {checkoutPending ? messages.checkout.redirecting : messages.checkout.button}
              </button>
              {checkoutError ? (
                <p className="cart-summary__error" role="alert">
                  {checkoutError}
                </p>
              ) : null}

              <p className="cart-summary__note">{messages.shop.deliveryNotice}</p>
              <p className="cart-summary__note cart-summary__note--checkout">
                {messages.checkout.secureNote}
              </p>

              <Link to="/shop" className="button cart-summary__continue">
                {messages.cart.continueShopping}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CartPage
