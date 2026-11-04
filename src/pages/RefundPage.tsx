import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { REFUND_REASONS, RefundRequestError, submitRefundRequest, type RefundReason } from '../lib/refunds'

function RefundPage() {
  const { messages } = useLocale()
  const [searchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('pedido') ?? '')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState<RefundReason | ''>('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const successTitleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!sent) return
    window.scrollTo(0, 0)
    successTitleRef.current?.focus({ preventScroll: true })
  }, [sent])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (sending || !reason) return

    setSending(true)
    setError('')

    try {
      await submitRefundRequest({ orderNumber, email, reason, details })
      setSent(true)
    } catch (err) {
      const code = err instanceof RefundRequestError ? err.code : 'network'
      setError(
        code === 'too_many_attempts'
          ? messages.refund.errorTooMany
          : code === 'invalid_request'
            ? messages.refund.errorInvalid
            : messages.refund.errorGeneric,
      )
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="page page--refund">
        <section className="checkout-result checkout-result--paid" aria-live="polite">
          <span className="checkout-result__eyebrow">{messages.refund.successEyebrow}</span>
          <h1 className="checkout-result__title" ref={successTitleRef} tabIndex={-1}>
            {messages.refund.successTitle}
          </h1>
          <p className="checkout-result__body">{messages.refund.successBody}</p>
          <div className="checkout-result__actions">
            <Link to="/shop" className="button button--primary">
              {messages.cart.continueShopping}
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page page--narrow page--refund">
      <section className="hero">
        <span className="hero__eyebrow">{messages.refund.eyebrow}</span>
        <h1>{messages.refund.title}</h1>
        <p>{messages.refund.intro}</p>
      </section>

      <section className="card refund-policy">
        <h2>{messages.refund.policyTitle}</h2>
        <p>{messages.refund.policyBody}</p>
      </section>

      <form className="auth-form refund-form" onSubmit={onSubmit}>
        <label className="form-field">
          <span className="visually-hidden">{messages.refund.orderLabel}</span>
          <input
            type="text"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder={messages.refund.orderPlaceholder}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="refund-order-hint"
            required
          />
        </label>
        <p className="form-hint" id="refund-order-hint">
          {messages.refund.orderHint}
        </p>

        <label className="form-field">
          <span className="visually-hidden">{messages.refund.emailLabel}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={messages.refund.emailPlaceholder}
            autoComplete="email"
            required
          />
        </label>

        <label className="form-field">
          <span className="visually-hidden">{messages.refund.reasonLabel}</span>
          <select value={reason} onChange={(event) => setReason(event.target.value as RefundReason)} required>
            <option value="" disabled>
              {messages.refund.reasonPlaceholder}
            </option>
            {REFUND_REASONS.map((code) => (
              <option key={code} value={code}>
                {messages.refund.reasonLabels[code]}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="visually-hidden">{messages.refund.detailsLabel}</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={messages.refund.detailsPlaceholder}
            maxLength={1000}
            rows={4}
            required={reason === 'other'}
          />
        </label>

        {error ? (
          <p className="editor-feedback editor-feedback--error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="button button--primary" disabled={sending}>
          {sending ? messages.refund.submitting : messages.refund.submit}
        </button>
        <p className="form-hint">{messages.refund.reviewNote}</p>
      </form>
    </div>
  )
}

export default RefundPage
