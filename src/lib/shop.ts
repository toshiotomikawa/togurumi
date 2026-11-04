import { CIRCULO_CHENILLE, type CirculoColor } from './circuloChenille'

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

function normalizeName(value: string) {
  return normalize(value).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

const CIRCULO_BY_CODE = new Map(CIRCULO_CHENILLE.map((color) => [color.code, color]))
// A Círculo name only counts when it is not also a plain color word: "Branco" or "Preto" in the
// sheet may mean any white or black, so those need the code (8001, 8990) to use the Círculo tone.
const CIRCULO_BY_NAME = new Map(
  CIRCULO_CHENILLE.filter((color) => !(normalizeName(color.name) in COLOR_SWATCHES)).map((color) => [normalizeName(color.name), color]),
)

/**
 * The Círculo color the sheet points to, by code ("2500", "2500 Acqua") or by a distinctive
 * Círculo name ("Acqua", "Chiclete"). Generic names such as "Azul" or "Rosa" return null and keep
 * the old swatch: no Círculo tone is guessed for them.
 */
export function findCirculoColor(color: string): CirculoColor | null {
  const code = /\b(\d{4})\b/.exec(color)?.[1]
  if (code && CIRCULO_BY_CODE.has(code)) return CIRCULO_BY_CODE.get(code)!
  const name = normalizeName(color.replace(/\b\d{4}\b/, '').replace(/^\s*[-–]\s*/, ''))
  return CIRCULO_BY_NAME.get(name) ?? null
}

export function getColorSwatch(color: string) {
  const normalized = normalize(color.trim())
  if (/^#[\da-f]{3,8}$/i.test(normalized)) return normalized
  const circulo = findCirculoColor(color)
  if (circulo) return circulo.hex
  return COLOR_SWATCHES[normalized] ?? '#b9aa9b'
}

// A hatched chip says "this variant has no tone set" instead of painting a made-up beige.
const UNKNOWN_TONE_BACKGROUND = 'repeating-linear-gradient(135deg, var(--border-strong) 0 4px, var(--surface) 4px 9px)'

/**
 * One tone, or two for a bicolor piece. The sheet keeps the whole label as one color
 * ("Amarelo com rosa"), so the second tone is optional and lives inside that label.
 */
export function parseColorTones(color: string) {
  return color
    .split(/\s*(?:\+|&)\s*|\s+(?:com|e)\s+/i)
    .map((tone) => tone.trim())
    .filter(Boolean)
}

function hasTone(color: string) {
  const normalized = normalize(color.trim())
  if (/^#[\da-f]{3,8}$/i.test(normalized)) return true
  return Boolean(findCirculoColor(color)) || Object.hasOwn(COLOR_SWATCHES, normalized)
}

export function isKnownColorTone(color: string) {
  const tones = parseColorTones(color)
  return tones.length > 0 && tones.every(hasTone)
}

/** CSS background for a swatch: a solid tone, two halves for a bicolor piece, or stripes for a blended Círculo yarn. */
export function getColorSwatchBackground(color: string) {
  const tones = parseColorTones(color)
  if (!isKnownColorTone(color)) return UNKNOWN_TONE_BACKGROUND
  if (tones.length === 2) {
    return `linear-gradient(90deg, ${getColorSwatch(tones[0])} 0 50%, ${getColorSwatch(tones[1])} 50% 100%)`
  }
  const blend = findCirculoColor(color)?.tones
  if (blend && blend.length > 1) {
    const step = 100 / blend.length
    return `linear-gradient(135deg, ${blend.map((tone, index) => `${tone} ${index * step}% ${(index + 1) * step}%`).join(', ')})`
  }
  return getColorSwatch(color)
}

export function matchesSearch(product: ShopProduct, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = normalize([product.name, product.category, product.description, product.yarn, product.designer, product.cores].join(' '))
  return tokens.every((token) => haystack.includes(token))
}
