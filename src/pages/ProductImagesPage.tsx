import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

type ProductImageTarget = {
  rowNumber: number
  name: string
  category: string
  defaultImage: string
  colors: string[]
  imagesByColor: Record<string, string>
}

type Feedback = {
  kind: 'success' | 'error'
  text: string
}

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_BYTES = 8 * 1024 * 1024

function ProductImagesPage() {
  const { messages } = useLocale()
  const { logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<ProductImageTarget[]>([])
  const [selectedRow, setSelectedRow] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const selectedProduct = useMemo(
    () => products.find((product) => product.rowNumber === Number(selectedRow)) ?? null,
    [products, selectedRow],
  )
  const currentImage = selectedProduct
    ? (selectedColor ? selectedProduct.imagesByColor[selectedColor] : selectedProduct.defaultImage)
    : ''

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        const response = await fetch('/api/shop/product-images', { credentials: 'include' })
        if (response.status === 401) {
          await logout()
          return
        }
        if (!response.ok) throw new Error('load_failed')

        const payload = (await response.json()) as { products: ProductImageTarget[] }
        if (cancelled) return
        setProducts(payload.products)
        setSelectedRow(payload.products[0] ? String(payload.products[0].rowNumber) : '')
      } catch {
        if (!cancelled) setFeedback({ kind: 'error', text: messages.auth.imagesLoadError })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProducts()
    return () => {
      cancelled = true
    }
  }, [logout, messages.auth.imagesLoadError])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function clearFile() {
    setFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFeedback(null)

    if (!nextFile || !ACCEPTED_TYPES.has(nextFile.type) || nextFile.size > MAX_FILE_BYTES) {
      clearFile()
      if (nextFile) setFeedback({ kind: 'error', text: messages.auth.imagesInvalidFile })
      return
    }

    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedProduct || !file || uploading) return

    setUploading(true)
    setFeedback(null)

    try {
      const query = new URLSearchParams({ name: selectedProduct.name, color: selectedColor })
      const response = await fetch(`/api/shop/product-images/${selectedProduct.rowNumber}?${query}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      if (response.status === 401) {
        await logout()
        return
      }
      if (!response.ok) throw new Error('upload_failed')

      const payload = (await response.json()) as {
        defaultImage: string
        imagesByColor: Record<string, string>
      }
      setProducts((current) => current.map((product) =>
        product.rowNumber === selectedProduct.rowNumber
          ? {
            ...product,
            defaultImage: payload.defaultImage,
            imagesByColor: payload.imagesByColor,
          }
          : product,
      ))
      clearFile()
      setFeedback({ kind: 'success', text: messages.auth.imagesUploadSuccess })
    } catch {
      setFeedback({ kind: 'error', text: messages.auth.imagesUploadError })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page admin-page">
      <div className="editor-head">
        <div>
          <span className="hero__eyebrow">{messages.auth.adminNav}</span>
          <h1>{messages.auth.imagesTitle}</h1>
        </div>
        <Link to="/admin" className="button">{messages.auth.cancel}</Link>
      </div>

      <p>{messages.auth.imagesIntro}</p>

      {feedback && (
        <p className={`editor-feedback editor-feedback--${feedback.kind}`} role="status">
          {feedback.text}
        </p>
      )}

      <form className="card editor-form product-image-form" onSubmit={onSubmit}>
        <label className="form-field field--wide">
          <span>{messages.auth.imagesProductLabel}</span>
          <select
            value={selectedRow}
            onChange={(event) => {
              setSelectedRow(event.target.value)
              setSelectedColor('')
              clearFile()
              setFeedback(null)
            }}
            disabled={loading || uploading}
          >
            {loading && <option value="">{messages.auth.imagesLoading}</option>}
            {!loading && products.length === 0 && (
              <option value="">{messages.auth.imagesNoProducts}</option>
            )}
            {products.map((product) => (
              <option value={product.rowNumber} key={product.rowNumber}>
                {product.name}{product.category ? ` - ${product.category}` : ''}
              </option>
            ))}
          </select>
        </label>

        {selectedProduct && selectedProduct.colors.length > 0 && (
          <label className="form-field field--wide">
            <span>{messages.auth.imagesColorLabel}</span>
            <select
              value={selectedColor}
              onChange={(event) => {
                setSelectedColor(event.target.value)
                clearFile()
                setFeedback(null)
              }}
              disabled={uploading}
            >
              <option value="">{messages.auth.imagesDefaultColor}</option>
              {selectedProduct.colors.map((color) => (
                <option value={color} key={color}>{color}</option>
              ))}
            </select>
            <small>{messages.auth.imagesColorHint}</small>
          </label>
        )}

        {selectedProduct && (
          <div className="product-image-preview">
            <span>{file ? messages.auth.imagesNewPreview : messages.auth.imagesCurrent}</span>
            {(previewUrl || currentImage) ? (
              <img src={previewUrl || currentImage} alt="" />
            ) : (
              <div className="product-image-preview__empty">{messages.auth.imagesNoImage}</div>
            )}
          </div>
        )}

        <label className="form-field field--wide">
          <span>{messages.auth.imagesFileLabel}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            disabled={!selectedProduct || uploading}
          />
          <small>{messages.auth.imagesFileHint}</small>
        </label>

        <div className="editor-form-actions">
          <button type="submit" className="button button--primary" disabled={!selectedProduct || !file || uploading}>
            {uploading ? messages.auth.imagesUploading : messages.auth.imagesUpload}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductImagesPage
