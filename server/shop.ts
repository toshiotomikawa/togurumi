import { slugifyProductName } from './checkout.js'
import type { StockIssue } from './orders.js'
import { getSheetTab, SheetsError, updateSheetCellByHeader } from './sheets.js'

export type ShopProduct = {
  name: string
  category: string
  price: number
  yarn: string
  cores: string
  stock: number
  description: string
  image: string
  imagesByColor: Record<string, string>
  releaseDate: string
  highlight: boolean
  designer: string
}

type ProductImages = {
  default: string
  colors: Record<string, string>
}

let lastKnownProducts: ShopProduct[] = []

function parseProductImages(value: string): ProductImages {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) return { default: trimmed, colors: {} }

  try {
    const parsed = JSON.parse(trimmed) as { default?: unknown; colors?: unknown }
    const colors = parsed.colors && typeof parsed.colors === 'object'
      ? Object.fromEntries(
        Object.entries(parsed.colors)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1])),
      )
      : {}

    return {
      default: typeof parsed.default === 'string' ? parsed.default : '',
      colors,
    }
  } catch {
    return { default: trimmed, colors: {} }
  }
}

function parseCatalogColors(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((color) => color.trim())
    .filter(Boolean)
}

function serializeProductImages(images: ProductImages) {
  if (Object.keys(images.colors).length === 0) return images.default
  return JSON.stringify(images)
}

/** Only positive BRL cells: 49,90, R$ 49,90, 1.234,56 or whole reais. */
export function parsePrice(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, '')
  if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{2})?$/.test(text)) {
    throw new SheetsError('invalid_price')
  }
  const [whole, fraction = '00'] = text.replace(/\./g, '').split(',')
  const cents = Number(whole) * 100 + Number(fraction)
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new SheetsError('invalid_price')
  return cents / 100
}

export type ProductImageTarget = {
  rowNumber: number
  name: string
  category: string
  defaultImage: string
  colors: string[]
  imagesByColor: Record<string, string>
}

export async function getProductImageTargets(): Promise<ProductImageTarget[]> {
  const rows = await getSheetTab('CATALOGO', { forceRefresh: true })

  return rows.flatMap((row, index) => {
    const name = row['MODELO']?.trim()
    if (!name) return []

    const images = parseProductImages(row['IMAGEM'] ?? '')
    const colorValue = row['CORES'] ?? row['Cores'] ?? ''

    return [{
      rowNumber: index + 2,
      name,
      category: row['TIPO'] ?? '',
      defaultImage: images.default,
      colors: parseCatalogColors(colorValue),
      imagesByColor: images.colors,
    }]
  })
}

export async function setProductImage(
  rowNumber: number,
  productName: string,
  color: string,
  imageUrl: string,
): Promise<ProductImages> {
  const rows = await getSheetTab('CATALOGO', { forceRefresh: true })
  const row = rows[rowNumber - 2]
  if (!row || row['MODELO'] !== productName) throw new SheetsError('row_changed')

  const currentImageValue = row['IMAGEM'] ?? ''
  const colorHeader = Object.hasOwn(row, 'CORES') ? 'CORES' : 'Cores'
  const colorValue = row[colorHeader] ?? ''
  const colors = parseCatalogColors(colorValue)
  if (color && !colors.includes(color)) throw new SheetsError('row_changed')

  const images = parseProductImages(currentImageValue)
  if (color) images.colors[color] = imageUrl
  else images.default = imageUrl

  await updateSheetCellByHeader(
    'CATALOGO',
    rowNumber,
    'IMAGEM',
    serializeProductImages(images),
    [
      { header: 'MODELO', value: productName },
      { header: 'IMAGEM', value: currentImageValue },
      { header: colorHeader, value: colorValue },
    ],
  )

  return images
}

export async function getShopProducts(options: { forceRefresh?: boolean } = {}): Promise<ShopProduct[]> {
  try {
    const rows = await getSheetTab('CATALOGO', options)

    const products = rows
      .filter((row) => row['MANTER?']?.trim().toLowerCase() === 'sim' && (row['PREÇO FINAL'] ?? row['PREAO FINAL'] ?? row['PRECO FINAL'])?.trim())
      .map((row) => {
        const images = parseProductImages(row['IMAGEM'] ?? '')
        const priceField = row['PREÇO FINAL'] ?? row['PREAO FINAL'] ?? row['PRECO FINAL'] ?? ''
        const descField = row['DESCRIÇÃO'] ?? row['DESCRIAAO'] ?? row['DESCRICAO'] ?? ''
        return {
          name: row['MODELO'],
          category: row['TIPO'],
          price: parsePrice(priceField),
          yarn: row['FIO'],
          cores: row['CORES'] ?? row['Cores'] ?? '',
          stock: Number(row['ESTOQUE']) || 0,
          description: descField,
          image: images.default || Object.values(images.colors)[0] || '',
          imagesByColor: images.colors,
          releaseDate: row['DATA'] ?? '',
          highlight: row['DESTAQUE']?.trim().toLowerCase() === 'sim',
          designer: row['DESIGNER'] ?? '',
        }
      })

    if (products.length > 0) {
      lastKnownProducts = products
    }
    return products
  } catch (err) {
    if (!options.forceRefresh && err instanceof SheetsError && err.code === 'fetch_failed' && lastKnownProducts.length > 0) {
      console.warn('[shop] Google Sheets unavailable, returning last known products cache')
      return lastKnownProducts
    }
    throw err
  }
}

type StockSheetAccess = {
  getRows: () => Promise<Record<string, string>[]>
  updateCell: (
    rowNumber: number,
    header: string,
    value: string,
    expected: { header: string; value: string }[],
  ) => Promise<void>
}

const sheetStockAccess: StockSheetAccess = {
  getRows: () => getSheetTab('CATALOGO', { forceRefresh: true }),
  updateCell: (rowNumber, header, value, expected) =>
    updateSheetCellByHeader('CATALOGO', rowNumber, header, value, expected),
}

const STOCK_UPDATE_ATTEMPTS = 3

/**
 * Subtracts a sold quantity from one product's ESTOQUE. The write is guarded by
 * the value just read, so a concurrent edit makes the update retry instead of
 * overwriting it. Stock never goes below zero; a shortfall is returned so the
 * order can be reviewed by hand.
 */
export async function decrementProductStock(
  slug: string,
  requested: number,
  access: StockSheetAccess = sheetStockAccess,
): Promise<StockIssue | null> {
  for (let attempt = 1; ; attempt += 1) {
    const rows = await access.getRows()
    const index = rows.findIndex((row) => row['MODELO'] && slugifyProductName(row['MODELO']) === slug)
    if (index < 0) return { slug, requested, available: 0 }

    const row = rows[index]
    const currentValue = row['ESTOQUE'] ?? ''
    const available = Math.max(0, Math.floor(Number(currentValue) || 0))

    try {
      await access.updateCell(index + 2, 'ESTOQUE', String(Math.max(0, available - requested)), [
        { header: 'MODELO', value: row['MODELO'] },
        { header: 'ESTOQUE', value: currentValue },
      ])
      return available < requested ? { slug, requested, available } : null
    } catch (err) {
      if (!(err instanceof SheetsError) || err.code !== 'row_changed' || attempt >= STOCK_UPDATE_ATTEMPTS) throw err
    }
  }
}

/** Current ESTOQUE per product slug, read fresh from the sheet. */
export type ShopShipping = {
  weightG?: number
  heightCm?: number
  widthCm?: number
  lengthCm?: number
}

function positiveCell(value: string | undefined) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/** Shipping measurements live beside ESTOQUE; empty cells stay undefined for the P/M/G fallback. */
export async function getShopShipping(
  access: Pick<StockSheetAccess, 'getRows'> = sheetStockAccess,
): Promise<Record<string, ShopShipping>> {
  const shipping: Record<string, ShopShipping> = {}
  for (const row of await access.getRows()) {
    if (!row['MODELO']) continue
    shipping[slugifyProductName(row['MODELO'])] = {
      weightG: positiveCell(row['PESO_G']),
      heightCm: positiveCell(row['ALTURA_CM']),
      widthCm: positiveCell(row['LARGURA_CM']),
      lengthCm: positiveCell(row['COMPRIMENTO_CM']),
    }
  }
  return shipping
}

export async function readShopStock(
  access: Pick<StockSheetAccess, 'getRows'> = sheetStockAccess,
): Promise<Record<string, number>> {
  const stock: Record<string, number> = {}
  for (const row of await access.getRows()) {
    if (!row['MODELO']) continue
    stock[slugifyProductName(row['MODELO'])] = Math.max(0, Math.floor(Number(row['ESTOQUE']) || 0))
  }
  return stock
}

/** Groups order items by product, since stock is tracked per product. */
export function stockQuantitiesBySlug(items: { slug: string; quantity: number }[]) {
  const totals = new Map<string, number>()
  for (const item of items) {
    if (item.slug) totals.set(item.slug, (totals.get(item.slug) ?? 0) + item.quantity)
  }
  return totals
}

export async function decrementShopStock(
  items: { slug: string; quantity: number }[],
  access: StockSheetAccess = sheetStockAccess,
): Promise<StockIssue[]> {
  const issues: StockIssue[] = []
  for (const [slug, requested] of stockQuantitiesBySlug(items)) {
    const issue = await decrementProductStock(slug, requested, access)
    if (issue) issues.push(issue)
  }
  return issues
}
