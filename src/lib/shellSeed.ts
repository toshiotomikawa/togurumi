import type { ShopProduct } from './shop'

export type ShellPiece = Pick<ShopProduct, 'name' | 'image'>

/**
 * What the build saw when it drew the home and shop openings into the page: the hero photos,
 * the shop cover and the published text per locale and section. The app starts from it, so its
 * first render matches what is already on screen, and replaces it once the live data arrives.
 */
export type ShellSeed = {
  pieces: ShellPiece[]
  cover?: ShellPiece
  content: Partial<Record<string, Record<string, Record<string, string>>>>
}

export function readShellSeed(): ShellSeed | undefined {
  return (globalThis as { __togurumiSeed?: ShellSeed }).__togurumiSeed
}
