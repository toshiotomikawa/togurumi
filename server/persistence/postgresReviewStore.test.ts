import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import { ReviewError } from '../reviews'
import { importLegacySnapshot, type LegacySnapshot } from './legacyImport'
import { localReviewStore } from './localAdapters'
import { PostgresLegacyImportSink, runMigrations } from './postgres'
import { PostgresReviewStore } from './postgresReviewStore'
import { createRuntimeReviewStore } from './reviewStore'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

async function createTestStore(now: () => number = Date.now, createId?: () => string) {
  const db = new PGlite()
  const migrationClient = {
    query: async (sql: string, params?: unknown[]) => {
      if (!params && sql.includes(';')) {
        await db.exec(sql)
        return { rows: [] }
      }
      return db.query(sql, params)
    },
  } as unknown as PoolClient
  await runMigrations(migrationClient, path.join(root, 'server', 'persistence', 'migrations'))
  return { db, store: new PostgresReviewStore(db as unknown as PoolClient, now, createId) }
}

test('runtime selection keeps the local adapter when DATABASE_URL is absent', () => {
  assert.equal(createRuntimeReviewStore(''), localReviewStore)
  assert.ok(createRuntimeReviewStore('postgres://example.invalid/togurumi') instanceof PostgresReviewStore)
})

test('list/add/delete preserve payloads and newest-first ordering', async () => {
  const times = [1_000, 3_000, 2_000]
  const ids = [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
  ]
  const { db, store } = await createTestStore(() => times.shift() as number, () => ids.shift() as string)
  try {
    const first = await store.add({ name: ' Bella ', rating: 4.4, comment: ' Lovely! ' })
    const second = await store.add({ name: 'Ana', rating: 5, comment: 'Perfect' })
    const third = await store.add({ name: 'Sol', rating: 3, comment: 'Cute' })

    assert.deepEqual(first, {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Bella', rating: 4, comment: 'Lovely!', createdAt: 1_000,
    })
    assert.deepEqual((await store.list()).map((review) => review.id), [second.id, third.id, first.id])
    assert.equal(await store.delete(third.id), true)
    assert.equal(await store.delete(third.id), false)
    assert.deepEqual((await store.list()).map((review) => review.id), [second.id, first.id])
  } finally {
    await db.close()
  }
})

test('validation matches the local contract and database constraints reject invalid rows', async () => {
  const { db, store } = await createTestStore()
  try {
    await assert.rejects(store.add({ name: ' ', rating: 5, comment: 'ok' }),
      (error: unknown) => error instanceof ReviewError && error.code === 'invalid_name')
    await assert.rejects(store.add({ name: 'Bella', rating: 0, comment: 'ok' }),
      (error: unknown) => error instanceof ReviewError && error.code === 'invalid_rating')
    await assert.rejects(store.add({ name: 'Bella', rating: 5, comment: ' ' }),
      (error: unknown) => error instanceof ReviewError && error.code === 'invalid_comment')

    const truncated = await store.add({ name: 'n'.repeat(80), rating: 4.6, comment: 'c'.repeat(700) })
    assert.equal(truncated.name.length, 60)
    assert.equal(truncated.comment.length, 600)
    assert.equal(truncated.rating, 5)

    await assert.rejects(db.query(
      `INSERT INTO reviews (id, name, rating, comment, created_at)
       VALUES ('00000000-0000-4000-8000-000000000099', '', 6, '', now())`,
    ))
  } finally {
    await db.close()
  }
})

test('basic concurrent inserts keep every distinct review', async () => {
  let sequence = 100
  const { db, store } = await createTestStore(() => 10_000 + sequence, () => {
    sequence += 1
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`
  })
  try {
    const created = await Promise.all(Array.from({ length: 10 }, (_, index) => store.add({
      name: `Visitor ${index}`,
      rating: (index % 5) + 1,
      comment: `Review ${index}`,
    })))
    assert.equal(new Set(created.map((review) => review.id)).size, 10)
    assert.equal((await store.list()).length, 10)
  } finally {
    await db.close()
  }
})

test('legacy import remains idempotent and readable through PostgresReviewStore', async () => {
  const { db, store } = await createTestStore()
  try {
    const snapshot: LegacySnapshot = {
      users: [], siteContent: [], faq: [], journal: [],
      reviews: [{
        id: '00000000-0000-4000-8000-000000000777',
        name: 'Legacy', rating: 5, comment: 'Imported', createdAt: 7_000,
      }],
    }
    const sink = new PostgresLegacyImportSink(db as unknown as PoolClient)
    await importLegacySnapshot(snapshot, sink)
    await importLegacySnapshot(snapshot, sink)

    assert.deepEqual(await store.list(), [{
      id: '00000000-0000-4000-8000-000000000777',
      name: 'Legacy', rating: 5, comment: 'Imported', createdAt: 7_000,
    }])
  } finally {
    await db.close()
  }
})
