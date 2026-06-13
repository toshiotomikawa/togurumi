import { getSheetTab } from './sheets'

export type ShopProduct = {
  name: string
  category: string
  price: number
  yarn: string
  eyes: string
  stock: number
  description: string
  image: string
  releaseDate: string
}

function parsePrice(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function getShopProducts(): Promise<ShopProduct[]> {
  const rows = await getSheetTab('CATALOGO')

  return rows
    .filter((row) => row['MANTER?']?.trim().toLowerCase() === 'sim' && row['PREÇO FINAL']?.trim())
    .map((row) => ({
      name: row['MODELO'],
      category: row['TIPO'],
      price: parsePrice(row['PREÇO FINAL']),
      yarn: row['FIO'],
      eyes: row['OLHOS'],
      stock: Number(row['ESTOQUE']) || 0,
      description: row['DESCRIÇÃO'] ?? '',
      image: row['IMAGEM'] ?? '',
      releaseDate: row['DATA'] ?? '',
    }))
}
