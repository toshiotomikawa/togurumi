import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import {
  countSnapshot,
  importLegacySnapshot,
  loadLegacySnapshot,
  type LegacyFaq,
  type LegacyImportSink,
  type LegacyJournalPost,
  type LegacyReview,
  type LegacySiteContent,
} from './legacyImport.js'
import type { UserRecord } from '../store.js'
import { PostgresLegacyImportSink, runMigrations } from './postgres.js'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

class MemorySink implements LegacyImportSink {
  users = new Map<string, UserRecord>()
  reviews = new Map<string, LegacyReview>()
  siteContent = new Map<string, LegacySiteContent>()
  faq = new Map<string, LegacyFaq>()
  journal = new Map<string, LegacyJournalPost>()

  async upsertUser(user: UserRecord) { this.users.set(user.username, user) }
  async upsertReview(review: LegacyReview) { this.reviews.set(review.id, review) }
  async upsertSiteContent(entry: LegacySiteContent) { this.siteContent.set(`${entry.locale}:${entry.section}`, entry) }
  async upsertFaq(entry: LegacyFaq) { this.faq.set(entry.locale, entry) }
  async upsertJournalPost(post: LegacyJournalPost) { this.journal.set(post.id, post) }
}

test('loads every versioned JSON and Markdown source with deterministic counts', async () => {
  const snapshot = await loadLegacySnapshot(root)
  assert.deepEqual(countSnapshot(snapshot), {
    users: 0,
    reviews: 0,
    siteContent: 18,
    faq: 3,
    journal: 13,
  })
  assert.equal(snapshot.journal.every((post) => post.slug && post.title && post.date), true)
  assert.equal(snapshot.journal.every((post) => post.author), true)
})

test('import is idempotent when the sink implements the declared upsert keys', async () => {
  const snapshot = await loadLegacySnapshot(root)
  const sink = new MemorySink()

  const first = await importLegacySnapshot(snapshot, sink)
  const sizesAfterFirst = {
    users: sink.users.size,
    reviews: sink.reviews.size,
    siteContent: sink.siteContent.size,
    faq: sink.faq.size,
    journal: sink.journal.size,
  }
  const second = await importLegacySnapshot(snapshot, sink)

  assert.deepEqual(first, countSnapshot(snapshot))
  assert.deepEqual(second, first)
  assert.deepEqual({
    users: sink.users.size,
    reviews: sink.reviews.size,
    siteContent: sink.siteContent.size,
    faq: sink.faq.size,
    journal: sink.journal.size,
  }, sizesAfterFirst)
})

test('initial migration defines the domain tables and idempotency constraints', async () => {
  const sql = await readFile(path.join(root, 'server', 'persistence', 'migrations', '0001_initial.sql'), 'utf8')
  for (const table of ['users', 'reviews', 'site_content', 'faq_content', 'journal_posts']) {
    assert.match(sql, new RegExp(`CREATE TABLE ${table}\\b`))
  }
  assert.match(sql, /username text NOT NULL UNIQUE/)
  assert.match(sql, /PRIMARY KEY \(locale, section\)/)
  assert.match(sql, /UNIQUE \(locale, slug\)/)
})

test('migration and two real PostgreSQL-compatible imports do not duplicate rows', async () => {
  const db = new PGlite()
  try {
    const migrationsDir = path.join(root, 'server', 'persistence', 'migrations')
    const migrationClient = {
      query: async (sql: string, params?: unknown[]) => {
        if (!params && sql.includes(';')) {
          await db.exec(sql)
          return { rows: [] }
        }
        return db.query(sql, params)
      },
    } as unknown as PoolClient
    await runMigrations(migrationClient, migrationsDir)
    await runMigrations(migrationClient, migrationsDir)
    const snapshot = await loadLegacySnapshot(root)
    const sink = new PostgresLegacyImportSink(db as unknown as PoolClient)

    await importLegacySnapshot(snapshot, sink)
    await importLegacySnapshot(snapshot, sink)

    const expected: Record<string, number> = {
      users: snapshot.users.length,
      reviews: snapshot.reviews.length,
      site_content: snapshot.siteContent.length,
      faq_content: snapshot.faq.length,
      journal_posts: snapshot.journal.length,
    }
    for (const [table, count] of Object.entries(expected)) {
      const result = await db.query<{ count: string }>(`SELECT count(*)::text AS count FROM ${table}`)
      assert.equal(Number(result.rows[0]?.count), count)
    }
    const migrations = await db.query<{ count: string }>('SELECT count(*)::text AS count FROM schema_migrations')
    const migrationFiles = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql'))
    assert.equal(migrations.rows[0]?.count, String(migrationFiles.length))
  } finally {
    await db.close()
  }
})
