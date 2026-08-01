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

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

const SINGLE_COLOR_LABELS = new Set(['cor unica', 'single color', 'color unico'])

const COLOR_SWATCHES: Record<string, string> = {
  amarelo: '#f2c94c',
  amarillo: '#f2c94c',
  azul: '#4f7fc1',
  'azul claro': '#79b9e3',
  'azul marinho': '#263f73',
  beige: '#d8c2a3',
  bege: '#d8c2a3',
  blanco: '#f8f6f0',
  branco: '#f8f6f0',
  brown: '#8a5d3b',
  cinza: '#92979c',
  creme: '#f2dfb8',
  gray: '#92979c',
  green: '#579663',
  grey: '#92979c',
  laranja: '#e9863b',
  lila: '#b18aca',
  lilac: '#b18aca',
  lilas: '#b18aca',
  marrom: '#8a5d3b',
  marron: '#8a5d3b',
  morado: '#8064a2',
  naranja: '#e9863b',
  negro: '#292625',
  orange: '#e9863b',
  pink: '#e89bb0',
  preto: '#292625',
  purple: '#8064a2',
  red: '#c94747',
  rojo: '#c94747',
  rosa: '#e89bb0',
  roxo: '#8064a2',
  verde: '#579663',
  vermelho: '#c94747',
  white: '#f8f6f0',
  yellow: '#f2c94c',
}

export function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(price)
}

export function isRecentlyReleased(releaseDate: string) {
  const match = /^(\d{1,2})\/(\d{2,4})$/.exec(releaseDate.trim())
  if (!match) return false

  const month = Number(match[1])
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2])
  if (month < 1 || month > 12) return false

  const release = new Date(year, month - 1, 1)
  const now = new Date()
  const diffMs = now.getTime() - release.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 30
}

function normalize(value: string) {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

export function parseProductColors(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((color) => color.trim())
    .filter((color) => color && !SINGLE_COLOR_LABELS.has(normalize(color)))
}

export function getColorSwatch(color: string) {
  const normalized = normalize(color.trim())
  if (/^#[\da-f]{3,8}$/i.test(normalized)) return normalized
  return COLOR_SWATCHES[normalized] ?? '#b9aa9b'
}

export function matchesSearch(product: ShopProduct, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = normalize([product.name, product.category, product.description, product.yarn, product.designer, product.cores].join(' '))
  return tokens.every((token) => haystack.includes(token))
}
