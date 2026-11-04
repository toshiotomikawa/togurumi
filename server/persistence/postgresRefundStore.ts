import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient, QueryResultRow } from 'pg'
import type { RefundDecision, RefundRequestInput, RefundRequestRecord, RefundStore } from '../refunds.js'

type DatabaseClient = Pool | PoolClient

type RefundRow = QueryResultRow & {
  id: string
  session_id: string
  reason: RefundRequestRecord['reason']
  details: string
  status: RefundRequestRecord['status']
  created_at: Date | string
  updated_at: Date | string
}

function toRefundRequest(row: RefundRow): RefundRequestRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export class PostgresRefundStore implements RefundStore {
  constructor(private readonly db: DatabaseClient) {}

  async add(input: RefundRequestInput): Promise<RefundRequestRecord | null> {
    const result = await this.db.query<RefundRow>(
      `INSERT INTO refund_requests (id, session_id, reason, details, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (session_id) DO NOTHING
       RETURNING *`,
      [randomUUID(), input.sessionId, input.reason, input.details],
    )
    const row = result.rows[0]
    return row ? toRefundRequest(row as RefundRow) : null
  }

  async list(): Promise<RefundRequestRecord[]> {
    const result = await this.db.query<RefundRow>('SELECT * FROM refund_requests ORDER BY created_at DESC')
    return result.rows.map((row) => toRefundRequest(row as RefundRow))
  }

  async setStatus(id: string, status: RefundDecision): Promise<RefundRequestRecord | null> {
    const result = await this.db.query<RefundRow>(
      `UPDATE refund_requests SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status],
    )
    const row = result.rows[0]
    return row ? toRefundRequest(row as RefundRow) : null
  }
}
