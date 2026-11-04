import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { OrderRecord } from './orders.js'

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

/** Matches the Checkout Session id shown on the order confirmation page. */
export const ORDER_NUMBER_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/

export const MAX_REFUND_DETAILS = 1000
export const MAX_REFUND_EMAIL = 254

export type RefundRequestInput = {
  sessionId: string
  reason: RefundReason
  details: string
}

export type RefundRequestRecord = RefundRequestInput & {
  id: string
  status: RefundStatus
  createdAt: number
  updatedAt: number
}

export interface RefundStore {
  /** Returns null when the order already has a request; one order, one request. */
  add(input: RefundRequestInput): Promise<RefundRequestRecord | null>
  list(): Promise<RefundRequestRecord[]>
  setStatus(id: string, status: RefundDecision): Promise<RefundRequestRecord | null>
}

export class RefundError extends Error {
  constructor(public code: 'invalid_request') {
    super(code)
  }
}

function isRefundReason(value: unknown): value is RefundReason {
  return typeof value === 'string' && (REFUND_REASONS as readonly string[]).includes(value)
}

/**
 * Reads only identifiers and the reason: the order number and e-mail are
 * checked against the stored order, never trusted.
 */
export function parseRefundRequest(body: unknown): RefundRequestInput {
  const data = (body ?? {}) as Record<string, unknown>
  const sessionId = typeof data.orderNumber === 'string' ? data.orderNumber.trim() : ''
  const reason = data.reason
  const details = typeof data.details === 'string' ? data.details.trim() : ''

  if (!ORDER_NUMBER_PATTERN.test(sessionId)) throw new RefundError('invalid_request')
  if (!isRefundReason(reason)) throw new RefundError('invalid_request')
  if (details.length > MAX_REFUND_DETAILS) throw new RefundError('invalid_request')
  if (reason === 'other' && !details) throw new RefundError('invalid_request')

  return { sessionId, reason, details }
}

export function normalizeRefundEmail(value: string) {
  return value.trim().toLowerCase()
}

/**
 * A request is accepted only for a paid order whose stored e-mail matches.
 * The caller answers the same thing either way, so the form never reveals
 * whether an order exists.
 */
export function refundEmailMatches(order: OrderRecord | null, email: string): order is OrderRecord {
  if (!order || order.status !== 'paid' || !order.customerEmail) return false
  return normalizeRefundEmail(order.customerEmail) === normalizeRefundEmail(email)
}

type RefundDatabase = {
  requests: Record<string, RefundRequestRecord>
}

/** In-memory refund store, optionally mirrored to a JSON file for local development. */
export class LocalRefundStore implements RefundStore {
  private db: RefundDatabase | null = null
  private queue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly filePath: string | null = null,
    private readonly now: () => number = Date.now,
  ) {}

  private async load(): Promise<RefundDatabase> {
    if (this.db) return this.db
    let loaded: RefundDatabase = { requests: {} }
    if (this.filePath) {
      try {
        const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as Partial<RefundDatabase>
        loaded = { requests: parsed.requests ?? {} }
      } catch {
        // Missing or unreadable file: start empty.
      }
    }
    this.db = loaded
    return loaded
  }

  private async persist(db: RefundDatabase) {
    if (!this.filePath) return
    await mkdir(path.dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(db, null, 2), 'utf8')
  }

  private serialize<T>(operation: (db: RefundDatabase) => Promise<T> | T): Promise<T> {
    const run = this.queue.then(async () => operation(await this.load()))
    this.queue = run.catch(() => undefined)
    return run
  }

  add(input: RefundRequestInput) {
    return this.serialize(async (db) => {
      const exists = Object.values(db.requests).some((request) => request.sessionId === input.sessionId)
      if (exists) return null

      const timestamp = this.now()
      const request: RefundRequestRecord = {
        ...input,
        id: randomUUID(),
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      db.requests[request.id] = request
      await this.persist(db)
      return structuredClone(request)
    })
  }

  list() {
    return this.serialize((db) =>
      Object.values(db.requests)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((request) => structuredClone(request)),
    )
  }

  setStatus(id: string, status: RefundDecision) {
    return this.serialize(async (db) => {
      const request = db.requests[id]
      if (!request) return null
      request.status = status
      request.updatedAt = this.now()
      await this.persist(db)
      return structuredClone(request)
    })
  }
}

export const localRefundStore = new LocalRefundStore(path.resolve('data', 'refund-requests.json'))
