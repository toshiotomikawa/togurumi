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

    const paid = await store.upsertOrder({ ...baseOrder, status: 'paid', paymentIntentId: 'pi_1', customerEmail: null })
    assert.equal(paid.status, 'paid')
    assert.equal(paid.paymentIntentId, 'pi_1')
    assert.equal(paid.customerEmail, 'buyer@example.com', 'missing details keep the stored value')

    assert.equal((await store.upsertOrder({ ...baseOrder, status: 'failed' })).status, 'paid')
    assert.equal((await store.upsertOrder({ ...baseOrder, status: 'pending', items: [] })).items.length, 1)

    const issue = { slug: 'urso-mochi', requested: 2, available: 1 }
    await store.recordStockIssues('cs_test_pg', [issue])
    await store.recordStockIssues('cs_test_pg', [{ ...issue, slug: 'polvo-ollie' }])
    await store.markStockApplied('cs_test_pg')
    const stored = await store.getOrder('cs_test_pg')
    assert.equal(stored?.stockApplied, true)
    assert.deepEqual(stored?.stockIssues.map((entry) => entry.slug), ['urso-mochi', 'polvo-ollie'])
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

test('reservations hold stock across checkouts and stock items are claimed once', async () => {
  const { db, store } = await createTestStore()
  try {
    const stock = { 'urso-mochi': 3, 'polvo-ollie': 1 }
    const later = Date.now() + 60 * 60 * 1000

    assert.deepEqual(
      await store.reserveStock('res_1', [{ slug: 'urso-mochi', quantity: 1 }, { slug: 'urso-mochi', quantity: 1 }], stock, later),
      { ok: true },
    )
    assert.deepEqual(
      await store.reserveStock('res_2', [{ slug: 'polvo-ollie', quantity: 1 }, { slug: 'urso-mochi', quantity: 2 }], stock, later),
      { ok: false, slug: 'urso-mochi', available: 1 },
    )
    const partial = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM stock_reservations WHERE reservation_id = 'res_2'")
    assert.equal(partial.rows[0]?.count, 0, 'a refused reservation holds nothing')

    // Expired holds do not count.
    assert.equal((await store.reserveStock('res_old', [{ slug: 'polvo-ollie', quantity: 1 }], stock, Date.now() - 1000)).ok, true)
    assert.equal((await store.reserveStock('res_3', [{ slug: 'polvo-ollie', quantity: 1 }], stock, later)).ok, true)

    await store.releaseReservation('res_1')
    assert.equal((await store.reserveStock('res_4', [{ slug: 'urso-mochi', quantity: 3 }], stock, later)).ok, true)

    // Deducted items are claimed once per product and stop counting as held.
    assert.equal(await store.claimStockItem('res_4', 'cs_4', 'urso-mochi', 3), true)
    assert.equal(await store.claimStockItem('res_4', 'cs_4', 'urso-mochi', 3), false)
    assert.equal((await store.reserveStock('res_5', [{ slug: 'urso-mochi', quantity: 3 }], stock, later)).ok, true)
    await store.releaseStockItem('res_4', 'urso-mochi')
    assert.equal(await store.claimStockItem('res_4', 'cs_4', 'urso-mochi', 3), true)
  } finally {
    await db.close()
  }
})
