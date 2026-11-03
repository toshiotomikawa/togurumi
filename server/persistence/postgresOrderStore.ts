import type { Pool, PoolClient, QueryResultRow } from 'pg'
import type {
  OrderInput,
  OrderRecord,
  OrderStatus,
  OrderStore,
  ReservationResult,
  StockIssue,
} from '../orders.js'

type DatabaseClient = Pool | PoolClient

const RESERVATION_LOCK_KEY = 727_001

type OrderRow = QueryResultRow & {
  session_id: string
  status: OrderStatus
  amount_total: number
  currency: string
  payment_intent_id: string | null
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
  shipping_address: OrderRecord['shippingAddress']
  items: OrderRecord['items']
  stock_applied: boolean
  stock_issues: StockIssue[]
  created_at: Date | string
  updated_at: Date | string
}

function parseJson<T>(value: T | string): T {
  return typeof value === 'string' ? JSON.parse(value) as T : value
}

function toOrder(row: OrderRow): OrderRecord {
  return {
    sessionId: row.session_id,
    status: row.status,
    amountTotal: Number(row.amount_total),
    currency: row.currency,
    paymentIntentId: row.payment_intent_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address === null ? null : parseJson(row.shipping_address),
    items: parseJson(row.items),
    stockApplied: row.stock_applied,
    stockIssues: parseJson(row.stock_issues),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export class PostgresOrderStore implements OrderStore {
  constructor(private readonly db: DatabaseClient) {}

  async withStockLock<T>(slug: string, operation: (store: OrderStore) => Promise<T>): Promise<T> {
    const pooled = 'totalCount' in this.db
    const client = pooled ? await (this.db as Pool).connect() : this.db
    try {
      await client.query('BEGIN')
      try {
        await client.query('SELECT pg_advisory_xact_lock(727002, hashtext($1))', [slug])
        const result = await operation(new PostgresOrderStore(client))
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    } finally {
      if (pooled) (client as PoolClient).release()
    }
  }

  async claimEvent(eventId: string, type: string): Promise<boolean> {
    const result = await this.db.query(
      'INSERT INTO stripe_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id',
      [eventId, type],
    )
    return result.rows.length > 0
  }

  async releaseEvent(eventId: string): Promise<void> {
    await this.db.query('DELETE FROM stripe_events WHERE id = $1', [eventId])
  }

  async upsertOrder(input: OrderInput): Promise<OrderRecord> {
    // Status rules mirror mergeOrderStatus(): paid is final, failed ignores a late pending.
    const result = await this.db.query<OrderRow>(
      `INSERT INTO orders
         (session_id, status, amount_total, currency, payment_intent_id, customer_email,
          customer_name, customer_phone, shipping_address, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb)
       ON CONFLICT (session_id) DO UPDATE SET
         status = CASE
           WHEN orders.status = 'paid' THEN 'paid'
           WHEN orders.status = 'failed' AND EXCLUDED.status = 'pending' THEN 'failed'
           ELSE EXCLUDED.status
         END,
         amount_total = EXCLUDED.amount_total,
         currency = EXCLUDED.currency,
         payment_intent_id = COALESCE(EXCLUDED.payment_intent_id, orders.payment_intent_id),
         customer_email = COALESCE(EXCLUDED.customer_email, orders.customer_email),
         customer_name = COALESCE(EXCLUDED.customer_name, orders.customer_name),
         customer_phone = COALESCE(EXCLUDED.customer_phone, orders.customer_phone),
         shipping_address = COALESCE(EXCLUDED.shipping_address, orders.shipping_address),
         items = CASE WHEN jsonb_array_length(EXCLUDED.items) > 0 THEN EXCLUDED.items ELSE orders.items END,
         updated_at = now()
       RETURNING *`,
      [
        input.sessionId,
        input.status,
        input.amountTotal,
        input.currency,
        input.paymentIntentId,
        input.customerEmail,
        input.customerName,
        input.customerPhone,
        input.shippingAddress === null ? null : JSON.stringify(input.shippingAddress),
        JSON.stringify(input.items),
      ],
    )
    return toOrder(result.rows[0] as OrderRow)
  }

  async reserveStock(
    reservationId: string,
    items: { slug: string; quantity: number }[],
    stock: Record<string, number>,
    expiresAt: number,
  ): Promise<ReservationResult> {
    const requested = new Map<string, number>()
    for (const item of items) requested.set(item.slug, (requested.get(item.slug) ?? 0) + item.quantity)

    // A pool hands out a dedicated connection so the lock and the transaction share it.
    const pooled = 'totalCount' in this.db
    const client = pooled ? await (this.db as Pool).connect() : this.db
    try {
      await client.query('BEGIN')
      try {
        // Serialises reservations so two checkouts cannot both take the last unit.
        await client.query('SELECT pg_advisory_xact_lock($1)', [RESERVATION_LOCK_KEY])
        const held = await client.query<{ slug: string; quantity: string }>(
          `SELECT r.slug, SUM(r.quantity)::text AS quantity
           FROM stock_reservations r
           WHERE r.released_at IS NULL AND r.expires_at > now() AND r.slug = ANY($1::text[])
             AND NOT EXISTS (
               SELECT 1 FROM order_stock_items a
               WHERE a.reservation_id = r.reservation_id AND a.slug = r.slug
             )
           GROUP BY r.slug`,
          [[...requested.keys()]],
        )
        const heldBySlug = new Map(held.rows.map((row) => [row.slug, Number(row.quantity)]))

        for (const [slug, quantity] of requested) {
          const available = Math.max(0, (stock[slug] ?? 0) - (heldBySlug.get(slug) ?? 0))
          if (quantity > available) {
            await client.query('ROLLBACK')
            return { ok: false, slug, available }
          }
        }

        for (const [slug, quantity] of requested) {
          await client.query(
            `INSERT INTO stock_reservations (reservation_id, slug, quantity, expires_at)
             VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))`,
            [reservationId, slug, quantity, expiresAt],
          )
        }
        await client.query('COMMIT')
        return { ok: true }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    } finally {
      if (pooled) (client as PoolClient).release()
    }
  }

  async releaseReservation(reservationId: string): Promise<void> {
    await this.db.query(
      'UPDATE stock_reservations SET released_at = now() WHERE reservation_id = $1 AND released_at IS NULL',
      [reservationId],
    )
  }

  async claimStockItem(reservationId: string, sessionId: string, slug: string, quantity: number): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO order_stock_items (reservation_id, slug, session_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (reservation_id, slug) DO NOTHING
       RETURNING slug`,
      [reservationId, slug, sessionId, quantity],
    )
    return result.rows.length > 0
  }

  async releaseStockItem(reservationId: string, slug: string): Promise<void> {
    await this.db.query('DELETE FROM order_stock_items WHERE reservation_id = $1 AND slug = $2', [reservationId, slug])
  }

  async recordStockIssues(sessionId: string, issues: StockIssue[]): Promise<void> {
    await this.db.query(
      'UPDATE orders SET stock_issues = stock_issues || $2::jsonb, updated_at = now() WHERE session_id = $1',
      [sessionId, JSON.stringify(issues)],
    )
  }

  async markStockApplied(sessionId: string): Promise<void> {
    await this.db.query('UPDATE orders SET stock_applied = true, updated_at = now() WHERE session_id = $1', [sessionId])
  }

  async getOrder(sessionId: string): Promise<OrderRecord | null> {
    const result = await this.db.query<OrderRow>('SELECT * FROM orders WHERE session_id = $1', [sessionId])
    const row = result.rows[0]
    return row ? toOrder(row as OrderRow) : null
  }
}
