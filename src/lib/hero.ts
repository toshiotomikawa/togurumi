import { slugify } from './slug'

/** Group shots read best in the wide hero; any other photographed piece fills the gaps. */
export const HERO_PREFERRED = ['pato-formoso', 'capivara-sereia', 'bebe-baleia']

// The photos are 4:5 and fill their tile. On phones the stage spans the screen and is 230px tall,
// so a photo is a third of the width plus the overlap, but never narrower than 184px (230 x 4/5).
// Wider screens put the stage beside the words, about a third of what is left.
export const HERO_PHOTO_SIZES = '(max-width: 840px) max(184px, calc(33.4vw + 48px)), max(280px, calc(33vw - 130px))'

// The shop cover spans the phone screen, and half the page on wider screens.
export const SHOP_COVER_SIZES = '(max-width: 840px) 100vw, 50vw'

/** The three photographed pieces the home hero shows, in order. */
export function pickHeroPieces<T extends { name: string; image: string }>(products: T[]): T[] {
  const photographed = products.filter(product => product.image)
  return [
    ...HERO_PREFERRED.map(slug => photographed.find(product => slugify(product.name) === slug)).filter((product): product is T => Boolean(product)),
    ...photographed.filter(product => !HERO_PREFERRED.includes(slugify(product.name))),
  ].slice(0, 3)
}
