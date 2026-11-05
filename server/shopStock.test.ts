import assert from 'node:assert/strict'
import test from 'node:test'
import { SheetsError } from './sheets.js'
import { decrementShopStock, setProductImage } from './shop.js'

function fakeSheet(rows: Record<string, string>[], options: { conflicts?: number } = {}) {
  let conflicts = options.conflicts ?? 0
  const writes: { rowNumber: number; value: string }[] = []
  return {
    writes,
    rows,
    access: {
      getRows: async () => rows.map((row) => ({ ...row })),
      updateCell: async (
        rowNumber: number,
        header: string,
        value: string,
        expected: { header: string; value: string }[],
      ) => {
        if (conflicts > 0) {
          conflicts -= 1
          throw new SheetsError('row_changed')
        }
        const row = rows[rowNumber - 2]
        assert.ok(row)
        for (const field of expected) assert.equal(row[field.header], field.value)
        row[header] = value
        writes.push({ rowNumber, value })
      },
    },
  }
}

test('sold quantities are subtracted per product, across colours', async () => {
  const sheet = fakeSheet([
    { MODELO: 'Polvo Ollie', ESTOQUE: '2' },
    { MODELO: 'Urso Mochi', ESTOQUE: '5' },
  ])
  const issues = await decrementShopStock(
    [
      { slug: 'urso-mochi', quantity: 1 },
      { slug: 'urso-mochi', quantity: 2 },
      { slug: 'polvo-ollie', quantity: 1 },
    ],
    sheet.access,
  )
  assert.deepEqual(issues, [])
  assert.equal(sheet.rows[1].ESTOQUE, '2')
  assert.equal(sheet.rows[0].ESTOQUE, '1')
})

test('stock never goes negative and shortfalls are reported', async () => {
  const sheet = fakeSheet([{ MODELO: 'Urso Mochi', ESTOQUE: '1' }])
  const issues = await decrementShopStock(
    [{ slug: 'urso-mochi', quantity: 3 }, { slug: 'dragao', quantity: 1 }],
    sheet.access,
  )
  assert.equal(sheet.rows[0].ESTOQUE, '0')
  assert.deepEqual(issues, [
    { slug: 'urso-mochi', requested: 3, available: 1 },
    { slug: 'dragao', requested: 1, available: 0 },
  ])
})

test('a concurrent sheet edit is retried, then surfaced', async () => {
  const retried = fakeSheet([{ MODELO: 'Urso Mochi', ESTOQUE: '4' }], { conflicts: 2 })
  assert.deepEqual(await decrementShopStock([{ slug: 'urso-mochi', quantity: 1 }], retried.access), [])
  assert.equal(retried.rows[0].ESTOQUE, '3')

  const stuck = fakeSheet([{ MODELO: 'Urso Mochi', ESTOQUE: '4' }], { conflicts: 3 })
  await assert.rejects(
    decrementShopStock([{ slug: 'urso-mochi', quantity: 1 }], stuck.access),
    (err: unknown) => err instanceof SheetsError && err.code === 'row_changed',
  )
  assert.equal(stuck.rows[0].ESTOQUE, '4')
})

test('a product image saves when the sheet name has stray spaces', async () => {
  const sheet = fakeSheet([
    { MODELO: 'Boba Tea ', CORES: 'Marrom, Rosa', IMAGEM: '' },
  ])
  const images = await setProductImage(2, 'Boba Tea', 'Marrom', 'https://ik.imagekit.io/x/a.png', sheet.access)
  assert.equal(images.colors.Marrom, 'https://ik.imagekit.io/x/a.png')
  assert.equal(sheet.writes.length, 1)
})

test('a product image is refused when the row now holds another product', async () => {
  const sheet = fakeSheet([{ MODELO: 'Urso Mochi', CORES: 'Rosa', IMAGEM: '' }])
  await assert.rejects(
    setProductImage(2, 'Boba Tea', 'Rosa', 'https://ik.imagekit.io/x/a.png', sheet.access),
    (err: unknown) => err instanceof SheetsError && err.code === 'row_changed',
  )
})
