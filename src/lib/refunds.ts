export const REFUND_REASONS = [
  'changed_mind',
  'damaged',
  'wrong_item',
  'not_received',
  'duplicate',
  'other',
] as const

export type RefundReason = (typeof REFUND_REASONS)[number]
export type RefundDecision = 'approved' | 'declined'
export type RefundStatus = 'pending' | RefundDecision

export type RefundOrderSummary = {
  status: string
  amountTotal: number
  currency: string
  customerEmail: string | null
  customerName: string | null
  items: { slug: string; name: string; color: string; quantity: number; unitAmount: number }[]
  createdAt: number
}

export type RefundRequest = {
  id: string
  sessionId: string
  reason: RefundReason
  details: string
  status: RefundStatus
  createdAt: number
  updatedAt: number
  order: RefundOrderSummary | null
}

export type RefundRequestErrorCode =
  | 'invalid_request'
  | 'too_many_attempts'
  | 'refund_failed'
  | 'unauthorized'
  | 'network'

export class RefundRequestError extends Error {
  readonly code: RefundRequestErrorCode

  constructor(code: RefundRequestErrorCode) {
    super(code)
    this.code = code
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/**
 * Sends the order number, the e-mail and the reason. The server answers the
 * same thing whether the order matches or not.
 */
export async function submitRefundRequest(input: {
  orderNumber: string
  email: string
  reason: RefundReason
  details: string
}): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })
  } catch {
    throw new RefundRequestError('network')
  }

  if (response.ok) return

  const code = await readJson<{ error?: string }>(response).then((data) => data?.error).catch(() => undefined)
  if (response.status === 429) throw new RefundRequestError('too_many_attempts')
  if (response.status === 400) throw new RefundRequestError('invalid_request')
  throw new RefundRequestError(code === 'refund_failed' ? 'refund_failed' : 'network')
}

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: 'include' })
  if (response.status === 401) throw new RefundRequestError('unauthorized')
  if (!response.ok) throw new RefundRequestError('refund_failed')
  return readJson<T>(response)
}

export async function fetchRefundRequests(): Promise<RefundRequest[]> {
  const { requests } = await adminRequest<{ requests: RefundRequest[] }>('/api/admin/refund-requests')
  return requests
}

export async function updateRefundStatus(id: string, status: RefundDecision): Promise<RefundRequest> {
  const { request } = await adminRequest<{ request: RefundRequest }>(`/api/admin/refund-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return request
}
