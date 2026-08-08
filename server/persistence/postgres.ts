import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { PoolClient } from 'pg'
import type {
  LegacyFaq,
  LegacyImportSink,
  LegacyJournalPost,
  LegacyReview,
  LegacySiteContent,
} from './legacyImport'
import type { UserRecord } from '../store'

export async function runMigrations(client: PoolClient, migrationsDir: string) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(migrationsDir)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort()
  for (const file of files) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file])
    if (applied.rows.length > 0) continue

    await client.query('BEGIN')
    try {
      await client.query(await readFile(path.join(migrationsDir, file), 'utf8'))
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
}

export class PostgresLegacyImportSink implements LegacyImportSink {
  constructor(private readonly client: PoolClient) {}

  async upsertUser(user: UserRecord) {
    await this.client.query(
      `INSERT INTO users (id, username, display_name, created_at, password_hash, google_id, email, role)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7, $8)
       ON CONFLICT (username) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         created_at = EXCLUDED.created_at,
         password_hash = EXCLUDED.password_hash,
         google_id = EXCLUDED.google_id,
         email = EXCLUDED.email,
         role = EXCLUDED.role`,
      [user.id, user.username, user.displayName, user.createdAt, user.passwordHash, user.googleId, user.email, user.role],
    )
  }

  async upsertReview(review: LegacyReview) {
    await this.client.query(
      `INSERT INTO reviews (id, name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, rating = EXCLUDED.rating,
         comment = EXCLUDED.comment, created_at = EXCLUDED.created_at`,
      [review.id, review.name, review.rating, review.comment, review.createdAt],
    )
  }

  async upsertSiteContent(entry: LegacySiteContent) {
    await this.client.query(
      `INSERT INTO site_content (locale, section, content)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (locale, section) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [entry.locale, entry.section, JSON.stringify(entry.content)],
    )
  }

  async upsertFaq(entry: LegacyFaq) {
    await this.client.query(
      `INSERT INTO faq_content (locale, content)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (locale) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [entry.locale, JSON.stringify(entry.content)],
    )
  }

  async upsertJournalPost(post: LegacyJournalPost) {
    await this.client.query(
      `INSERT INTO journal_posts
         (id, slug, locale, title, published_on, sort_order, summary, body, author, archived)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug, locale = EXCLUDED.locale, title = EXCLUDED.title,
         published_on = EXCLUDED.published_on, sort_order = EXCLUDED.sort_order,
         summary = EXCLUDED.summary, body = EXCLUDED.body,
         author = EXCLUDED.author, archived = EXCLUDED.archived, updated_at = now()`,
      [post.id, post.slug, post.locale, post.title, post.date, post.order, post.summary, post.body, post.author, post.archived],
    )
  }
}
