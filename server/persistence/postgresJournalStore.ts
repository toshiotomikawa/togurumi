import type { Pool, PoolClient, QueryResultRow } from 'pg'
import {
  JournalError,
  journalPostId,
  validateJournalInput,
  type JournalLocale,
  type JournalPostInput,
  type JournalPostRecord,
  type PublicJournalPost,
  type PublicJournalPostWithBody,
} from '../journal.js'
import type { JournalStore } from './contracts.js'

type DatabaseClient = Pool | PoolClient

type JournalRow = QueryResultRow & {
  id: string
  slug: string
  locale: JournalLocale
  title: string
  published_on: Date | string
  sort_order: number
  summary: string
  body?: string
  author?: string
  archived: boolean
}

function toRecord(row: JournalRow): JournalPostRecord {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    title: row.title,
    date: typeof row.published_on === 'string'
      ? row.published_on.slice(0, 10)
      : row.published_on.toISOString().slice(0, 10),
    order: row.sort_order,
    summary: row.summary,
    archived: row.archived,
  }
}

function toPost(row: JournalRow): JournalPostRecord & { body: string } {
  return { ...toRecord(row), body: row.body ?? '' }
}

function toPublicPost(row: JournalRow): PublicJournalPost {
  return { ...toRecord(row), author: row.author ?? 'Bella' }
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown })?.code === '23505'
}

export class PostgresJournalStore implements JournalStore {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<JournalPostRecord[]> {
    const result = await this.db.query<JournalRow>(
      `SELECT id, slug, locale, title, published_on, sort_order, summary, archived
       FROM journal_posts ORDER BY slug, locale`,
    )
    return result.rows.map(toRecord)
  }

  async get(id: string): Promise<(JournalPostRecord & { body: string }) | null> {
    const result = await this.db.query<JournalRow>(
      `SELECT id, slug, locale, title, published_on, sort_order, summary, body, archived
       FROM journal_posts WHERE id = $1`,
      [id],
    )
    return result.rows[0] ? toPost(result.rows[0]) : null
  }

  async create(input: JournalPostInput): Promise<JournalPostRecord & { body: string }> {
    validateJournalInput(input)
    const id = journalPostId(input.slug, input.locale)
    try {
      const result = await this.db.query<JournalRow>(
        `INSERT INTO journal_posts
           (id, slug, locale, title, published_on, sort_order, summary, body, archived)
         VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9)
         RETURNING id, slug, locale, title, published_on, sort_order, summary, body, archived`,
        [id, input.slug, input.locale, input.title, input.date, input.order, input.summary, input.body, input.archived],
      )
      return toPost(result.rows[0] as JournalRow)
    } catch (error) {
      if (isUniqueViolation(error)) throw new JournalError('slug_exists')
      throw error
    }
  }

  async update(id: string, input: JournalPostInput): Promise<JournalPostRecord & { body: string }> {
    validateJournalInput(input)
    const nextId = journalPostId(input.slug, input.locale)
    try {
      const result = await this.db.query<JournalRow>(
        `UPDATE journal_posts SET
           id = $2, slug = $3, locale = $4, title = $5, published_on = $6::date,
           sort_order = $7, summary = $8, body = $9, archived = $10, updated_at = now()
         WHERE id = $1
         RETURNING id, slug, locale, title, published_on, sort_order, summary, body, archived`,
        [id, nextId, input.slug, input.locale, input.title, input.date, input.order, input.summary, input.body, input.archived],
      )
      if (!result.rows[0]) throw new JournalError('not_found')
      return toPost(result.rows[0])
    } catch (error) {
      if (error instanceof JournalError) throw error
      if (isUniqueViolation(error)) throw new JournalError('slug_exists')
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query('DELETE FROM journal_posts WHERE id = $1 RETURNING id', [id])
    return result.rows.length > 0
  }

  async setArchived(id: string, archived: boolean): Promise<JournalPostRecord & { body: string }> {
    const result = await this.db.query<JournalRow>(
      `UPDATE journal_posts SET archived = $2, updated_at = now() WHERE id = $1
       RETURNING id, slug, locale, title, published_on, sort_order, summary, body, archived`,
      [id, archived],
    )
    if (!result.rows[0]) throw new JournalError('not_found')
    return toPost(result.rows[0])
  }

  async listPublic(locale: JournalLocale, author?: string, includeArchived = false): Promise<PublicJournalPost[]> {
    const params: unknown[] = [locale, includeArchived]
    const authorFilter = author ? ' AND lower(author) = lower($3)' : ''
    if (author) params.push(author)
    const result = await this.db.query<JournalRow>(
      `SELECT id, slug, locale, title, published_on, sort_order, summary, author, archived
       FROM journal_posts
       WHERE locale = $1 AND ($2::boolean OR NOT archived)${authorFilter}
       ORDER BY sort_order, published_on DESC`,
      params,
    )
    return result.rows.map(toPublicPost)
  }

  async getPublic(
    slug: string,
    locale: JournalLocale,
    includeArchived = false,
  ): Promise<PublicJournalPostWithBody | null> {
    const result = await this.db.query<JournalRow>(
      `SELECT id, slug, locale, title, published_on, sort_order, summary, body, author, archived
       FROM journal_posts WHERE slug = $1 AND locale = $2 AND ($3::boolean OR NOT archived)`,
      [slug, locale, includeArchived],
    )
    return result.rows[0] ? { ...toPublicPost(result.rows[0]), body: result.rows[0].body ?? '' } : null
  }
}
