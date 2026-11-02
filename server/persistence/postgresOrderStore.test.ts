import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import { localOrderStore, type OrderInput } from '../orders.js'
import { createRuntimeOrderStore } from './orderStore.js'
import { runMigrations } from './postgres.js'
import { PostgresOrderStore } from './postgresOrderStore.js'

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
  return { db, store: new PostgresOrderStore(db as unknown as PoolClient) }
}

const baseOrder: OrderInput = {
  sessionId: 'cs_test_pg',
  status: 'pending',
  amountTotal: 17980,
  currency: 'brl',
  paymentIntentId: null,
  customerEmail: 'buyer@example.com',
  customerName: 'Test Buyer',
  customerPhone: null,
  shippingAddress: { name: 'Test Buyer', line1: 'Rua Exemplo, 1', line2: null, city: 'Cidade', state: 'PR', postalCode: '00000-000', country: 'BR' },
  items: [{ slug: 'urso-mochi', name: 'Urso Mochi (Rosa)', color: 'Rosa', quantity: 2, unitAmount: 8990 }],
}

test('runtime selection keeps the local adapter when DATABASE_URL is absent', () => {
  assert.equal(createRuntimeOrderStore(''), localOrderStore)
  assert.ok(createRuntimeOrderStore('postgres://example.invalid/togurumi') instanceof PostgresOrderStore)
})

test('Stripe event ids are claimed once and can be released for a retry', async () => {
  const { db, store } = await createTestStore()
  try {
    assert.equal(await store.claimEvent('evt_1', 'checkout.session.completed'), true)
    assert.equal(await store.claimEvent('evt_1', 'checkout.session.completed'), false)
    await store.releaseEvent('evt_1')
    assert.equal(await store.claimEvent('evt_1', 'checkout.session.completed'), true)
  } finally {
    await db.close()
  }
})

test('orders upsert by session, keep paid final and claim stock once', async () => {
  const { db, store } = await createTestStore()
  try {
    const pending = await store.upsertOrder(baseOrder)
    assert.equal(pending.status, 'pending')
    assert.deepEqual(pending.items, baseOrder.items)
    assert.deepEqual(pending.shippingAddress, baseOrder.shippingAddress)
    assert.equal(await store.claimStock('cs_test_pg'), false, 'pending orders do not take stock')

    const paid = await store.upsertOrder({ ...baseOrder, status: 'paid', paymentIntentId: 'pi_1', customerEmail: null })
    assert.equal(paid.status, 'paid')
    assert.equal(paid.paymentIntentId, 'pi_1')
    assert.equal(paid.customerEmail, 'buyer@example.com', 'missing details keep the stored value')

    assert.equal((await store.upsertOrder({ ...baseOrder, status: 'failed' })).status, 'paid')
    assert.equal((await store.upsertOrder({ ...baseOrder, status: 'pending', items: [] })).items.length, 1)

    assert.equal(await store.claimStock('cs_test_pg'), true)
    assert.equal(await store.claimStock('cs_test_pg'), false)
    await store.releaseStock('cs_test_pg')
    assert.equal(await store.claimStock('cs_test_pg'), true)

    const issues = [{ slug: 'urso-mochi', requested: 2, available: 1 }]
    await store.recordStockIssues('cs_test_pg', issues)
    const stored = await store.getOrder('cs_test_pg')
    assert.equal(stored?.stockApplied, true)
    assert.deepEqual(stored?.stockIssues, issues)
    assert.equal(await store.getOrder('cs_test_missing'), null)
  } finally {
    await db.close()
  }
})

test('a failed order ignores a late pending event but accepts a later payment', async () => {
  const { db, store } = await createTestStore()
  try {
    await store.upsertOrder({ ...baseOrder, status: 'failed' })
    assert.equal((await store.upsertOrder(baseOrder)).status, 'failed')
    assert.equal((await store.upsertOrder({ ...baseOrder, status: 'paid' })).status, 'paid')
  } finally {
    await db.close()
  }
})
