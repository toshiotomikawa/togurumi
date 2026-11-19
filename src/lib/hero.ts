import { slugify } from './slug'

/** Group shots read best in the wide hero; any other photographed piece fills the gaps. */
export const HERO_PREFERRED = ['pato-formoso', 'capivara-sereia', 'bebe-baleia']

// The tiles are tall and crop wide photos, so a photo must be wider than its tile.
export const HERO_PHOTO_SIZES = '(max-width: 840px) 80vw, 50vw'

/** The three photographed pieces the home hero shows, in order. */
export function pickHeroPieces<T extends { name: string; image: string }>(products: T[]): T[] {
  const photographed = products.filter(product => product.image)
  return [
    ...HERO_PREFERRED.map(slug => photographed.find(product => slugify(product.name) === slug)).filter((product): product is T => Boolean(product)),
    ...photographed.filter(product => !HERO_PREFERRED.includes(slugify(product.name))),
  ].slice(0, 3)
}
