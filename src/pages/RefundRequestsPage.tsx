import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import {
  RefundRequestError,
  fetchRefundRequests,
  updateRefundStatus,
  type RefundDecision,
  type RefundRequest,
} from '../lib/refunds'
import { formatPrice } from '../lib/shop'

function RefundRequestsPage() {
  const { locale, messages } = useLocale()
  const { logout } = useAuth()
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const loaded = await fetchRefundRequests()
        if (!cancelled) setRequests(loaded)
      } catch (err) {
        if (err instanceof RefundRequestError && err.code === 'unauthorized') {
          await logout()
          return
        }
        if (!cancelled) setError(messages.refundAdmin.updateError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [logout, messages.refundAdmin.updateError])

  async function decide(id: string, status: RefundDecision) {
    if (savingId) return
    setSavingId(id)
    setError('')

    try {
      const updated = await updateRefundStatus(id, status)
      setRequests((current) => current.map((request) => (request.id === id ? updated : request)))
    } catch (err) {
      if (err instanceof RefundRequestError && err.code === 'unauthorized') {
        await logout()
        return
      }
      setError(messages.refundAdmin.updateError)
    } finally {
      setSavingId('')
    }
  }

  const statusLabels: Record<RefundRequest['status'], string> = {
    pending: messages.refundAdmin.statusPending,
    approved: messages.refundAdmin.statusApproved,
    declined: messages.refundAdmin.statusDeclined,
  }

  return (
    <div className="page admin-page">
      <section className="hero hero--admin">
        <span className="hero__eyebrow">{messages.auth.adminNav}</span>
        <h1>{messages.refundAdmin.title}</h1>
        <p>{messages.refundAdmin.intro}</p>
      </section>

      <p className="card refund-note">{messages.refundAdmin.draftNote}</p>

      {error ? (
        <p className="editor-feedback editor-feedback--error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p>{messages.auth.loadingLabel}</p>
      ) : requests.length === 0 ? (
        <p>{messages.refundAdmin.empty}</p>
      ) : (
        <div className="refund-requests">
          {requests.map((request) => (
            <article className="card refund-request" key={request.id}>
              <div className="refund-request__head">
                <span className="refund-request__order">{request.sessionId}</span>
                <span className={`refund-status refund-status--${request.status}`}>{statusLabels[request.status]}</span>
              </div>

              <dl className="refund-request__meta">
                <div>
                  <dt>{messages.refundAdmin.dateLabel}</dt>
                  <dd>{new Date(request.createdAt).toLocaleString(locale)}</dd>
                </div>
                <div>
                  <dt>{messages.refundAdmin.customerLabel}</dt>
                  <dd>
                    {request.order
                      ? [request.order.customerName, request.order.customerEmail].filter(Boolean).join(' · ') ||
                        messages.refundAdmin.noOrder
                      : messages.refundAdmin.noOrder}
                  </dd>
                </div>
                <div>
                  <dt>{messages.refundAdmin.amountLabel}</dt>
                  <dd>{request.order ? formatPrice(request.order.amountTotal / 100, locale) : '—'}</dd>
                </div>
                <div>
                  <dt>{messages.refundAdmin.reasonLabel}</dt>
                  <dd>{messages.refund.reasonLabels[request.reason]}</dd>
                </div>
              </dl>

              {request.details ? <p className="refund-request__details">{request.details}</p> : null}

              {request.order ? (
                <ul className="refund-request__items">
                  {request.order.items.map((item) => (
                    <li key={`${item.slug}-${item.color}`}>
                      {item.quantity}× {item.name}
                      {item.color ? ` (${item.color})` : ''}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="refund-request__actions">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={Boolean(savingId) || request.status === 'approved'}
                  onClick={() => void decide(request.id, 'approved')}
                >
                  {messages.refundAdmin.approve}
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={Boolean(savingId) || request.status === 'declined'}
                  onClick={() => void decide(request.id, 'declined')}
                >
                  {messages.refundAdmin.decline}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="admin-actions">
        <Link to="/admin" className="button">
          {messages.refundAdmin.back}
        </Link>
      </div>
    </div>
  )
}

export default RefundRequestsPage
