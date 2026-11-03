import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePrice } from './shop.js'

test('BRL prices are parsed exactly without guessing decimal separators', () => {
  for (const [cell, expected] of [['R$ 49,90', 49.9], ['49,90', 49.9], ['1.234,56', 1234.56], ['35', 35], ['0,01', 0.01]] as const) {
    assert.equal(parsePrice(cell), expected)
  }
  for (const cell of ['49.90', 'R$49.90', '', 'abc', '0', '0,00', '-1,00', '12,3', '1,234.56', '1e3', '35 reais', '01,00', '9007199254740992']) {
    assert.throws(() => parsePrice(cell), /invalid_price/, cell)
  }
})


test('checkout catalog forces fresh prices and never falls back after a sheet error', async (t) => {
  const { JWT } = await import('google-auth-library')
  const { getShopProducts } = await import('./shop.js')
  const { resetAuthClientForTest } = await import('./sheets.js')
  const names = ['GOOGLE_SHEETS_SPREADSHEET_ID', 'GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY']
  const previous = names.map(name => process.env[name])
  names.forEach(name => { process.env[name] = 'test-placeholder' })
  let price = 'R$ 49,90'
  let fail = false
  t.mock.method(JWT.prototype, 'request', async () => {
    if (fail) throw new Error('sheet offline')
    return { data: { values: [['MODELO', 'MANTER?', 'PREÇO FINAL'], ['Urso', 'Sim', price]] } }
  })
  resetAuthClientForTest()
  try {
    assert.equal((await getShopProducts())[0].price, 49.9)
    price = 'R$ 50,00'
    assert.equal((await getShopProducts({ forceRefresh: true }))[0].price, 50)
    fail = true
    await assert.rejects(getShopProducts({ forceRefresh: true }), /fetch_failed/)
    fail = false
    price = '49.90'
    await assert.rejects(getShopProducts({ forceRefresh: true }), /invalid_price/)
  } finally {
    names.forEach((name, i) => {
      if (previous[i] === undefined) delete process.env[name]
      else process.env[name] = previous[i]
    })
    resetAuthClientForTest()
  }
})
