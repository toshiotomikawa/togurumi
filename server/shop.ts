import { getSheetTab, SheetsError, updateSheetCellByHeader } from './sheets'

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

function parsePrice(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
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

export async function getShopProducts(): Promise<ShopProduct[]> {
  const rows = await getSheetTab('CATALOGO')

  return rows
    .filter((row) => row['MANTER?']?.trim().toLowerCase() === 'sim' && row['PREÇO FINAL']?.trim())
    .map((row) => {
      const images = parseProductImages(row['IMAGEM'] ?? '')
      return {
        name: row['MODELO'],
        category: row['TIPO'],
        price: parsePrice(row['PREÇO FINAL']),
        yarn: row['FIO'],
        cores: row['CORES'] ?? row['Cores'] ?? '',
        stock: Number(row['ESTOQUE']) || 0,
        description: row['DESCRIÇÃO'] ?? '',
        image: images.default || Object.values(images.colors)[0] || '',
        imagesByColor: images.colors,
        releaseDate: row['DATA'] ?? '',
        highlight: row['DESTAQUE']?.trim().toLowerCase() === 'sim',
        designer: row['DESIGNER'] ?? '',
      }
    })
}
