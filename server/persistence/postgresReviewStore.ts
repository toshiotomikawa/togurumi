import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient, QueryResultRow } from 'pg'
import { normalizeReviewInput, type ReviewRecord } from '../reviews'
import type { ReviewStore } from './contracts'

type DatabaseClient = Pool | PoolClient

type ReviewRow = QueryResultRow & {
  id: string
  name: string
  rating: number
  comment: string
  created_at: Date | string
}

function toReview(row: ReviewRow): ReviewRecord {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export class PostgresReviewStore implements ReviewStore {
  constructor(
    private readonly db: DatabaseClient,
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = randomUUID,
  ) {}

  async list(): Promise<ReviewRecord[]> {
    const result = await this.db.query<ReviewRow>('SELECT * FROM reviews ORDER BY created_at DESC')
    return result.rows.map(toReview)
  }

  async add(input: { name: string; rating: number; comment: string }): Promise<ReviewRecord> {
    const normalized = normalizeReviewInput(input)
    const review: ReviewRecord = { id: this.createId(), ...normalized, createdAt: this.now() }
    const result = await this.db.query<ReviewRow>(
      `INSERT INTO reviews (id, name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))
       RETURNING *`,
      [review.id, review.name, review.rating, review.comment, review.createdAt],
    )
    return toReview(result.rows[0] as ReviewRow)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id])
    return result.rows.length > 0
  }
}
