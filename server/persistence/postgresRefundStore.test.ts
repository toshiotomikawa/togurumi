import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import type { OrderInput } from '../orders.js'
import { localRefundStore } from '../refunds.js'
import { createRuntimeRefundStore } from './refundStore.js'
import { runMigrations } from './postgres.js'
import { PostgresOrderStore } from './postgresOrderStore.js'
import { PostgresRefundStore } from './postgresRefundStore.js'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

const baseOrder: OrderInput = {
  sessionId: 'cs_test_pg_refund',
  status: 'paid',
  amountTotal: 8990,
  currency: 'brl',
  paymentIntentId: 'pi_refund',
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  customerPhone: null,
  shippingAddress: null,
  items: [{ slug: 'urso-mochi', name: 'Urso Mochi', color: 'Rosa', quantity: 1, unitAmount: 8990 }],
}

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
  await new PostgresOrderStore(db as unknown as PoolClient).upsertOrder(baseOrder)
  return { db, store: new PostgresRefundStore(db as unknown as PoolClient) }
}

test('runtime selection keeps the local adapter when DATABASE_URL is absent', () => {
  assert.equal(createRuntimeRefundStore(''), localRefundStore)
  assert.ok(createRuntimeRefundStore('postgres://example.invalid/togurumi') instanceof PostgresRefundStore)
})

test('stores one request per order, lists it and updates the decision', async () => {
  const { db, store } = await createTestStore()
  try {
    const created = await store.add({ sessionId: baseOrder.sessionId, reason: 'changed_mind', details: '' })
    assert.ok(created)
    assert.equal(created.status, 'pending')

    assert.equal(
      await store.add({ sessionId: baseOrder.sessionId, reason: 'damaged', details: 'again' }),
      null,
      'the unique session_id keeps a second request out',
    )

    const list = await store.list()
    assert.equal(list.length, 1)
    assert.equal(list[0]?.id, created.id)

    const approved = await store.setStatus(created.id, 'approved')
    assert.equal(approved?.status, 'approved')
    assert.equal(await store.setStatus('f2f3a9c4-0000-4000-8000-000000000099', 'declined'), null)
    assert.equal((await store.list())[0]?.status, 'approved')
  } finally {
    await db.close()
  }
})
