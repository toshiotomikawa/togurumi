import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import { JournalError, type JournalPostInput } from '../journal'
import { createRuntimeJournalStore } from './journalStore'
import { importLegacySnapshot, loadLegacySnapshot } from './legacyImport'
import { localJournalStore } from './localAdapters'
import { PostgresLegacyImportSink, runMigrations } from './postgres'
import { PostgresJournalStore } from './postgresJournalStore'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

async function createTestStore() {
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
  return { db, store: new PostgresJournalStore(db as unknown as PoolClient) }
}

function input(overrides: Partial<JournalPostInput> = {}): JournalPostInput {
  return {
    slug: 'first-post', locale: 'en-US', title: 'First post', date: '2026-01-01',
    order: 0, summary: 'Summary', body: '# Markdown', archived: false, ...overrides,
  }
}

test('runtime selection keeps the local adapter and its 13 public Markdown posts without DATABASE_URL', async () => {
  assert.equal(createRuntimeJournalStore(''), localJournalStore)
  assert.ok(createRuntimeJournalStore('postgres://example.invalid/togurumi') instanceof PostgresJournalStore)
  const posts = (await Promise.all([
    localJournalStore.listPublic('en-US', undefined, true),
    localJournalStore.listPublic('pt-BR', undefined, true),
    localJournalStore.listPublic('es-ES', undefined, true),
  ])).flat()
  assert.equal(posts.length, 13)
  assert.equal(posts.every((post) => post.author), true)
})

test('admin CRUD, archive and locale-specific ids preserve current contracts', async () => {
  const { db, store } = await createTestStore()
  try {
    const created = await store.create(input())
    const portuguese = await store.create(input({ slug: 'first-post', locale: 'pt-BR', title: 'Primeiro post' }))
    assert.equal(created.id, 'first-post')
    assert.equal(portuguese.id, 'first-post.pt-BR')
    assert.deepEqual(await store.get(created.id), created)

    const updated = await store.update(created.id, input({ slug: 'renamed', title: 'Renamed', body: 'Updated' }))
    assert.equal(updated.id, 'renamed')
    assert.equal(await store.get(created.id), null)
    assert.deepEqual(await store.get(updated.id), updated)

    const archived = await store.setArchived(updated.id, true)
    assert.equal(archived.archived, true)
    assert.equal(await store.delete(updated.id), true)
    assert.equal(await store.delete(updated.id), false)
  } finally {
    await db.close()
  }
})

test('slug uniqueness and input validation preserve JournalError codes under concurrency', async () => {
  const { db, store } = await createTestStore()
  try {
    const results = await Promise.allSettled([store.create(input()), store.create(input())])
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    assert.ok(rejected.reason instanceof JournalError)
    assert.equal(rejected.reason.code, 'slug_exists')
    await assert.rejects(store.create(input({ title: '' })),
      (error: unknown) => error instanceof JournalError && error.code === 'invalid_input')
  } finally {
    await db.close()
  }
})

test('public reads preserve order, author filter, locale isolation and archive visibility', async () => {
  const { db, store } = await createTestStore()
  try {
    const sink = new PostgresLegacyImportSink(db as unknown as PoolClient)
    await sink.upsertJournalPost({
      id: 'old', slug: 'old', locale: 'en-US', title: 'Old', date: '2025-01-01', order: 1,
      summary: 'Old', body: 'Old body', author: 'Bella', archived: false,
    })
    await sink.upsertJournalPost({
      id: 'new', slug: 'new', locale: 'en-US', title: 'New', date: '2026-01-01', order: 0,
      summary: 'New', body: 'New body', author: 'Guest', archived: false,
    })
    await sink.upsertJournalPost({
      id: 'hidden', slug: 'hidden', locale: 'en-US', title: 'Hidden', date: '2026-02-01', order: 0,
      summary: 'Hidden', body: 'Hidden body', author: 'Bella', archived: true,
    })
    await sink.upsertJournalPost({
      id: 'spanish', slug: 'new', locale: 'es-ES', title: 'Nuevo', date: '2026-01-01', order: 0,
      summary: 'Nuevo', body: 'Cuerpo', author: 'Bella', archived: false,
    })

    assert.deepEqual((await store.listPublic('en-US')).map((post) => post.id), ['new', 'old'])
    assert.deepEqual((await store.listPublic('en-US', 'bella')).map((post) => post.id), ['old'])
    assert.deepEqual((await store.listPublic('en-US', undefined, true)).map((post) => post.id), ['hidden', 'new', 'old'])
    assert.equal((await store.getPublic('hidden', 'en-US'))?.id, undefined)
    assert.equal((await store.getPublic('hidden', 'en-US', true))?.body, 'Hidden body')
    assert.equal((await store.getPublic('new', 'es-ES'))?.title, 'Nuevo')
  } finally {
    await db.close()
  }
})

test('repeated legacy import keeps all 13 posts and authors without duplication or loss', async () => {
  const { db, store } = await createTestStore()
  try {
    const snapshot = await loadLegacySnapshot(root)
    const sink = new PostgresLegacyImportSink(db as unknown as PoolClient)
    await importLegacySnapshot(snapshot, sink)
    await importLegacySnapshot(snapshot, sink)

    const count = await db.query<{ count: string }>('SELECT count(*)::text AS count FROM journal_posts')
    assert.equal(Number(count.rows[0]?.count), 13)
    for (const source of snapshot.journal) {
      const loaded = await store.getPublic(source.slug, source.locale, true)
      assert.equal(loaded?.id, source.id)
      assert.equal(loaded?.body, source.body)
      assert.equal(loaded?.author, source.author)
      assert.equal(loaded?.archived, source.archived)
    }
  } finally {
    await db.close()
  }
})
