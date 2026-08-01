import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

const URL_ENDPOINT = (process.env.IMAGEKIT_URL_ENDPOINT ?? '').replace(/\/$/, '')
const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY ?? ''
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

type ImageType = {
  extension: 'jpg' | 'png' | 'webp'
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
}

type ImageKitUploadResponse = {
  fileId?: string
  url?: string
}

export class ImageKitError extends Error {
  constructor(public code: 'disabled' | 'invalid_image' | 'upload_failed') {
    super(code)
  }
}

export function imageKitEnabled() {
  return Boolean(URL_ENDPOINT && PRIVATE_KEY)
}

function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', mimeType: 'image/jpeg' }
  }

  const pngSignature = '89504e470d0a1a0a'
  if (buffer.length >= 8 && buffer.subarray(0, 8).toString('hex') === pngSignature) {
    return { extension: 'png', mimeType: 'image/png' }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: 'webp', mimeType: 'image/webp' }
  }

  return null
}

function authorizationHeader() {
  return `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString('base64')}`
}

export type UploadedImage = {
  fileId: string
  url: string
}

async function normalizeImage(buffer: Buffer, imageType: ImageType) {
  let pipeline = sharp(buffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: 'inside',
      withoutEnlargement: true,
    })

  if (imageType.extension === 'jpg') pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true })
  if (imageType.extension === 'png') pipeline = pipeline.png({ compressionLevel: 9 })
  if (imageType.extension === 'webp') pipeline = pipeline.webp({ quality: 88 })

  try {
    // Sharp drops EXIF and other metadata unless withMetadata() is requested.
    return await pipeline.toBuffer()
  } catch {
    throw new ImageKitError('invalid_image')
  }
}

export async function uploadProductImage(buffer: Buffer): Promise<UploadedImage> {
  if (!imageKitEnabled()) throw new ImageKitError('disabled')
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new ImageKitError('invalid_image')

  const imageType = detectImageType(buffer)
  if (!imageType) throw new ImageKitError('invalid_image')
  const normalized = await normalizeImage(buffer, imageType)

  const form = new FormData()
  const fileName = `${randomUUID()}.${imageType.extension}`
  form.append('file', new Blob([new Uint8Array(normalized)], { type: imageType.mimeType }), fileName)
  form.append('fileName', fileName)
  form.append('folder', '/products')
  form.append('useUniqueFileName', 'false')

  let response: Response
  try {
    response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: authorizationHeader() },
      body: form,
    })
  } catch {
    throw new ImageKitError('upload_failed')
  }

  if (!response.ok) throw new ImageKitError('upload_failed')

  let result: ImageKitUploadResponse
  try {
    result = (await response.json()) as ImageKitUploadResponse
  } catch {
    throw new ImageKitError('upload_failed')
  }
  if (!result.fileId || !result.url || !result.url.startsWith(`${URL_ENDPOINT}/`)) {
    throw new ImageKitError('upload_failed')
  }

  return { fileId: result.fileId, url: result.url }
}

export async function deleteImageKitFile(fileId: string): Promise<void> {
  if (!imageKitEnabled()) return

  try {
    await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: { Authorization: authorizationHeader() },
    })
  } catch {
    // Best-effort cleanup after a Sheets update failure.
  }
}
