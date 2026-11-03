import { existsSync, readFileSync } from 'node:fs'

// Original geometric fallback for Git-only builds; not Flaticon artwork.
export const fallbackStarPath = 'M256 24 310 188 488 188 344 290 400 460 256 356 112 460 168 290 24 188 202 188Z'

export function readRatingStar(file: URL): string {
  if (!existsSync(file)) return fallbackStarPath
  const paths = [...readFileSync(file, 'utf8').matchAll(/<path\b[^>]*\bd="([^"]+)"/g)]
  if (paths.length !== 1 || !/^[MmLlHhVvCcSsQqTtAaZz0-9.,+\s-]+$/.test(paths[0][1])) {
    throw new Error('Rating star must contain exactly one SVG path with valid path characters')
  }
  return paths[0][1]
}
