import { slugify } from './slug'

/** Group shots read best in the wide hero; any other photographed piece fills the gaps. */
export const HERO_PREFERRED = ['pato-formoso', 'capivara-sereia', 'bebe-baleia']

// The photos are 4:5 and fill their tile. On phones the stage spans the screen and is 230px tall,
// so a photo is a third of the width plus the overlap, but never narrower than 184px (230 x 4/5).
// Wider screens put the stage beside the words, about a third of what is left.
export const HERO_PHOTO_SIZES = '(max-width: 840px) max(184px, calc(33.4vw + 48px)), max(280px, calc(33vw - 130px))'

// The shop cover is 220px wide on phones, about a third of the page beside the words on tablets,
// and a little over half the page on wider screens (studio-v5.css, measured).
export const SHOP_COVER_SIZES = '(max-width: 520px) 220px, (max-width: 840px) 34vw, 58vw'

/** The three photographed pieces the home hero shows, in order. */
export function pickHeroPieces<T extends { name: string; image: string }>(products: T[]): T[] {
  const photographed = products.filter(product => product.image)
  return [
    ...HERO_PREFERRED.map(slug => photographed.find(product => slugify(product.name) === slug)).filter((product): product is T => Boolean(product)),
    ...photographed.filter(product => !HERO_PREFERRED.includes(slugify(product.name))),
  ].slice(0, 3)
}

// The middle hero photo is the one browsers time as the largest paint, so it alone is fetched first.
export const LCP_TILE = 1
