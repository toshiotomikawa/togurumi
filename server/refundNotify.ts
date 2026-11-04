import type { OrderRecord } from './orders.js'
import type { RefundRequestRecord } from './refunds.js'

export const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Togurumi <onboarding@resend.dev>'

export type RefundNotificationConfig = {
  apiKey: string
  to: string
  from: string
}

/**
 * Both variables are optional on purpose: without them the site keeps
 * working and only the admin list records the request.
 */
export function refundNotificationConfig(
  env: Record<string, string | undefined> = process.env,
): RefundNotificationConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  const to = env.REFUND_NOTIFY_EMAIL?.trim()
  if (!apiKey || !to) return null
  return { apiKey, to, from: env.REFUND_EMAIL_FROM?.trim() || DEFAULT_FROM }
}

const reasonLabels: Record<RefundRequestRecord['reason'], string> = {
  changed_mind: 'Desistência (direito de arrependimento)',
  damaged: 'Peça chegou danificada',
  wrong_item: 'Peça diferente da comprada',
  not_received: 'Pedido não recebido',
  duplicate: 'Cobrança duplicada',
  other: 'Outro motivo',
}

function formatBrl(amountInCents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountInCents / 100)
}

function itemLines(order: OrderRecord) {
  return order.items
    .map((item) => `- ${item.quantity}x ${item.name}${item.color ? ` (${item.color})` : ''}`)
    .join('\n')
}

export function buildRefundNotification(
  request: RefundRequestRecord,
  order: OrderRecord,
  adminUrl: string,
) {
  const customer = [order.customerName, order.customerEmail].filter(Boolean).join(' · ') || 'sem dados'
  const subject = `Nova solicitação de reembolso — ${order.sessionId.slice(-10)}`
  const text = [
    'Nova solicitação de reembolso no site.',
    '',
    `Pedido: ${order.sessionId}`,
    `Cliente: ${customer}`,
    `Valor pago: ${formatBrl(order.amountTotal)}`,
    '',
    'Itens:',
    itemLines(order),
    '',
    `Motivo: ${reasonLabels[request.reason]}`,
    request.details ? `Detalhe: ${request.details}` : 'Detalhe: (não informado)',
    '',
    `Revisar no painel: ${adminUrl}`,
    '',
    'O reembolso é feito manualmente no painel da Stripe; marcar como aprovada ou recusada na lista não movimenta dinheiro.',
  ].join('\n')

  return { subject, text }
}

export async function sendRefundNotification(
  config: RefundNotificationConfig,
  request: RefundRequestRecord,
  order: OrderRecord,
  adminUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const { subject, text } = buildRefundNotification(request, order, adminUrl)
  const response = await fetchImpl(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      text,
      ...(order.customerEmail ? { reply_to: order.customerEmail } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) throw new Error(`resend_${response.status}`)
}
