import type { ReactNode } from 'react'
import { avifSrcSet } from '../lib/images'

/** Offers the photo as AVIF first; the <img> inside stays the photo for every other browser. */
function AvifPicture({ src, sizes, children }: { src: string; sizes: string; children: ReactNode }) {
  const srcSet = avifSrcSet(src)
  if (!srcSet) return children
  return (
    <picture className="avif-picture">
      <source type="image/avif" srcSet={srcSet} sizes={sizes} />
      {children}
    </picture>
  )
}

export default AvifPicture
