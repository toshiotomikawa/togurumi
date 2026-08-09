import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcrypt'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import { localUserStore } from './localAdapters.js'
import { runMigrations } from './postgres.js'
import { PostgresUserStore } from './postgresUserStore.js'
import { bootstrapUsers } from './userBootstrap.js'
import { createRuntimeUserStore } from './userStore.js'

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
  return { db, store: new PostgresUserStore(db as unknown as PoolClient) }
}

test('runtime selection keeps the local adapter when DATABASE_URL is absent', () => {
  assert.equal(createRuntimeUserStore(''), localUserStore)
  assert.ok(createRuntimeUserStore('postgres://example.invalid/togurumi') instanceof PostgresUserStore)
})

test('password users preserve profile, password hash and role fields', async () => {
  const { db, store } = await createTestStore()
  try {
    const created = await store.createWithPassword('bella', 'initial-password', 'admin')
    assert.equal(await bcrypt.compare('initial-password', created.passwordHash ?? ''), true)

    created.displayName = 'Bella'
    created.email = 'bella@example.com'
    created.passwordHash = await bcrypt.hash('updated-password', 4)
    await store.save(created)

    const loaded = await store.findByUsername('bella')
    assert.equal(loaded?.displayName, 'Bella')
    assert.equal(loaded?.email, 'bella@example.com')
    assert.equal(loaded?.role, 'admin')
    assert.equal(await bcrypt.compare('updated-password', loaded?.passwordHash ?? ''), true)
  } finally {
    await db.close()
  }
})

test('concurrent Google creation enforces googleId and username uniqueness', async () => {
  const { db, store } = await createTestStore()
  try {
    const sameIdentity = await Promise.all([
      store.createWithGoogle('google-1', 'bella@example.com', 'moderator'),
      store.createWithGoogle('google-1', 'bella@example.com', 'moderator'),
    ])
    assert.equal(sameIdentity[0]?.id, sameIdentity[1]?.id)

    const differentIdentities = await Promise.all([
      store.createWithGoogle('google-2', 'artist@example.com', 'moderator'),
      store.createWithGoogle('google-3', 'artist@example.net', 'moderator'),
    ])
    assert.notEqual(differentIdentities[0]?.username, differentIdentities[1]?.username)

    const counts = await db.query<{ users: string; google_ids: string; usernames: string }>(
      `SELECT count(*)::text AS users,
              count(DISTINCT google_id)::text AS google_ids,
              count(DISTINCT username)::text AS usernames
       FROM users`,
    )
    assert.deepEqual(counts.rows[0], { users: '3', google_ids: '3', usernames: '3' })
  } finally {
    await db.close()
  }
})

test('explicit bootstrap is idempotent and does not replace existing credentials', async () => {
  const { db, store } = await createTestStore()
  try {
    const accounts = [
      { username: 'admin', password: 'first-admin-password', role: 'admin' as const },
      { username: 'moderator', password: 'first-moderator-password', role: 'moderator' as const },
    ]
    await bootstrapUsers(store, accounts)
    await bootstrapUsers(store, accounts.map((account) => ({ ...account, password: 'replacement-password' })))

    const count = await db.query<{ count: string }>('SELECT count(*)::text AS count FROM users')
    assert.equal(count.rows[0]?.count, '2')
    const admin = await store.findByUsername('admin')
    assert.equal(await bcrypt.compare('first-admin-password', admin?.passwordHash ?? ''), true)
    assert.equal(await bcrypt.compare('replacement-password', admin?.passwordHash ?? ''), false)
  } finally {
    await db.close()
  }
})
