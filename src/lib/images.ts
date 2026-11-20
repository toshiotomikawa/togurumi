const IMAGEKIT = 'https://ik.imagekit.io/'
const WIDTHS = [240, 360, 480, 720, 960, 1200]

/**
 * Lets the browser pick a photo close to its shown size. ImageKit resizes and picks
 * WebP or AVIF on its side; any other address is used as it is.
 */
/**
 * The same widths as AVIF, about a third smaller than WebP at the same quality. ImageKit's
 * automatic format stops at WebP on this account, so pages ask for AVIF by name in a <picture>
 * and browsers without it take the regular photo.
 */
export function avifSrcSet(src: string): string | undefined {
  if (!src.startsWith(IMAGEKIT) || src.includes('?')) return undefined
  return WIDTHS.map(width => `${src}?tr=w-${width},f-avif,q-80 ${width}w`).join(', ')
}

export function photoProps(src: string, sizes: string, fallbackWidth = 720) {
  if (!src.startsWith(IMAGEKIT) || src.includes('?')) return { src }
  const at = (width: number) => `${src}?tr=w-${width},f-auto,q-80`
  return {
    src: at(fallbackWidth),
    srcSet: WIDTHS.map(width => `${at(width)} ${width}w`).join(', '),
    sizes,
  }
}
