import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type OrderStatus = 'pending' | 'paid' | 'failed'

export type OrderItem = {
  slug: string
  name: string
  color: string
  quantity: number
  unitAmount: number
}

export type StockIssue = {
  slug: string
  requested: number
  available: number
}

export type ReservationResult =
  | { ok: true }
  | { ok: false; slug: string; available: number }

export type ShippingAddress = {
  name: string | null
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
}

export type OrderInput = {
  sessionId: string
  status: OrderStatus
  amountTotal: number
  currency: string
  paymentIntentId: string | null
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  shippingAddress: ShippingAddress | null
  items: OrderItem[]
}

export type OrderRecord = OrderInput & {
  stockApplied: boolean
  stockIssues: StockIssue[]
  createdAt: number
  updatedAt: number
}

export interface OrderStore {
  /** Returns false when the Stripe event id was already processed. */
  claimEvent(eventId: string, type: string): Promise<boolean>
  /** Forgets an event whose processing failed so Stripe's retry runs again. */
  releaseEvent(eventId: string): Promise<void>
  upsertOrder(input: OrderInput): Promise<OrderRecord>
  /**
   * Atomically holds stock for a Checkout Session. `stock` is the sheet's
   * ESTOQUE per slug; active holds from other sessions are subtracted from it.
   */
  reserveStock(
    reservationId: string,
    items: { slug: string; quantity: number }[],
    stock: Record<string, number>,
    expiresAt: number,
  ): Promise<ReservationResult>
  /** Frees a hold (session expired, async payment failed, session not created). */
  releaseReservation(reservationId: string): Promise<void>
  /**
   * Claims the stock deduction of one product of one checkout. Returns false
   * when it was already applied, so a redelivered webhook never deducts twice.
   * A claimed item no longer counts as reserved.
   */
  claimStockItem(reservationId: string, sessionId: string, slug: string, quantity: number): Promise<boolean>
  /** Undoes claimStockItem after the sheet update failed, so a retry applies it. */
  releaseStockItem(reservationId: string, slug: string): Promise<void>
  /** Appends stock shortfalls found while deducting an order. */
  recordStockIssues(sessionId: string, issues: StockIssue[]): Promise<void>
  /** Marks every item of the order as deducted. */
  markStockApplied(sessionId: string): Promise<void>
  getOrder(sessionId: string): Promise<OrderRecord | null>
}

/**
 * Stripe may deliver events out of order. A paid order never goes back to
 * pending or failed; everything else follows the newest event.
 */
export function mergeOrderStatus(current: OrderStatus | undefined, incoming: OrderStatus): OrderStatus {
  if (current === 'paid') return 'paid'
  if (current === 'failed' && incoming === 'pending') return 'failed'
  return incoming
}

type Reservation = {
  reservationId: string
  slug: string
  quantity: number
  expiresAt: number
  released: boolean
}

type OrderDatabase = {
  events: Record<string, { type: string; receivedAt: number }>
  orders: Record<string, OrderRecord>
  reservations: Record<string, Reservation>
  stockItems: Record<string, { sessionId: string; quantity: number; appliedAt: number }>
}

function itemKey(reservationId: string, slug: string) {
  return `${reservationId}\u0000${slug}`
}

/** In-memory order store, optionally mirrored to a JSON file for local development. */
export class LocalOrderStore implements OrderStore {
  private db: OrderDatabase | null = null
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly filePath: string | null = null,
    private readonly now: () => number = Date.now,
  ) {}

  private async load(): Promise<OrderDatabase> {
    if (this.db) return this.db
    let loaded: OrderDatabase = { events: {}, orders: {}, reservations: {}, stockItems: {} }
    if (this.filePath) {
      try {
        const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as Partial<OrderDatabase>
        loaded = {
          events: parsed.events ?? {},
          orders: parsed.orders ?? {},
          reservations: parsed.reservations ?? {},
          stockItems: parsed.stockItems ?? {},
        }
      } catch {
        // Missing or unreadable file: start empty.
      }
    }
    this.db = loaded
    return loaded
  }

  private async persist(db: OrderDatabase) {
    if (!this.filePath) return
    await mkdir(path.dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(db, null, 2), 'utf8')
  }

  private serialize<T>(operation: (db: OrderDatabase) => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.load()
      return operation(db)
    })
    this.queue = run.catch(() => undefined)
    return run
  }

  claimEvent(eventId: string, type: string) {
    return this.serialize(async (db) => {
      if (db.events[eventId]) return false
      db.events[eventId] = { type, receivedAt: this.now() }
      await this.persist(db)
      return true
    })
  }

  releaseEvent(eventId: string) {
    return this.serialize(async (db) => {
      delete db.events[eventId]
      await this.persist(db)
    })
  }

  upsertOrder(input: OrderInput) {
    return this.serialize(async (db) => {
      const existing = db.orders[input.sessionId]
      const timestamp = this.now()
      const order: OrderRecord = {
        ...input,
        status: mergeOrderStatus(existing?.status, input.status),
        items: input.items.length > 0 ? input.items : existing?.items ?? [],
        stockApplied: existing?.stockApplied ?? false,
        stockIssues: existing?.stockIssues ?? [],
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }
      db.orders[input.sessionId] = order
      await this.persist(db)
      return structuredClone(order)
    })
  }

  reserveStock(
    reservationId: string,
    items: { slug: string; quantity: number }[],
    stock: Record<string, number>,
    expiresAt: number,
  ) {
    return this.serialize(async (db): Promise<ReservationResult> => {
      const now = this.now()
      const held = new Map<string, number>()
      for (const [key, hold] of Object.entries(db.reservations)) {
        if (hold.released || hold.expiresAt <= now || db.stockItems[key]) continue
        held.set(hold.slug, (held.get(hold.slug) ?? 0) + hold.quantity)
      }

      const requested = new Map<string, number>()
      for (const item of items) requested.set(item.slug, (requested.get(item.slug) ?? 0) + item.quantity)
      for (const [slug, quantity] of requested) {
        const available = Math.max(0, (stock[slug] ?? 0) - (held.get(slug) ?? 0))
        if (quantity > available) return { ok: false, slug, available }
      }

      for (const [slug, quantity] of requested) {
        db.reservations[itemKey(reservationId, slug)] = { reservationId, slug, quantity, expiresAt, released: false }
      }
      await this.persist(db)
      return { ok: true }
    })
  }

  releaseReservation(reservationId: string) {
    return this.serialize(async (db) => {
      for (const hold of Object.values(db.reservations)) {
        if (hold.reservationId === reservationId) hold.released = true
      }
      await this.persist(db)
    })
  }

  claimStockItem(reservationId: string, sessionId: string, slug: string, quantity: number) {
    return this.serialize(async (db) => {
      const key = itemKey(reservationId, slug)
      if (db.stockItems[key]) return false
      db.stockItems[key] = { sessionId, quantity, appliedAt: this.now() }
      await this.persist(db)
      return true
    })
  }

  releaseStockItem(reservationId: string, slug: string) {
    return this.serialize(async (db) => {
      delete db.stockItems[itemKey(reservationId, slug)]
      await this.persist(db)
    })
  }

  recordStockIssues(sessionId: string, issues: StockIssue[]) {
    return this.serialize(async (db) => {
      const order = db.orders[sessionId]
      if (!order) return
      order.stockIssues = [...order.stockIssues, ...issues]
      order.updatedAt = this.now()
      await this.persist(db)
    })
  }

  markStockApplied(sessionId: string) {
    return this.serialize(async (db) => {
      const order = db.orders[sessionId]
      if (!order) return
      order.stockApplied = true
      order.updatedAt = this.now()
      await this.persist(db)
    })
  }

  getOrder(sessionId: string) {
    return this.serialize((db) => {
      const order = db.orders[sessionId]
      return order ? structuredClone(order) : null
    })
  }
}

export const localOrderStore = new LocalOrderStore(path.resolve('data', 'orders.json'))
