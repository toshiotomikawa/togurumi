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
  highlight: boolean
}

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

export function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(price)
}

export function isRecentlyReleased(releaseDate: string) {
  const match = /^(\d{1,2})\/(\d{2,4})$/.exec(releaseDate.trim())
  if (!match) return false

  const month = Number(match[1])
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2])
  if (month < 1 || month > 12) return false

  const now = new Date()
  const monthsAgo = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return monthsAgo >= 0 && monthsAgo <= 1
}

function normalize(value: string) {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

export function matchesSearch(product: ShopProduct, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = normalize([product.name, product.category, product.description, product.yarn].join(' '))
  return tokens.every((token) => haystack.includes(token))
}
