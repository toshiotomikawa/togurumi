import { useLocale } from '../hooks/useLocale'

function GalleryPage() {
  const { messages } = useLocale()

  return (
    <div className="page">
      <section className="hero">
        <span className="hero__eyebrow">{messages.gallery.eyebrow}</span>
        <h1>{messages.gallery.title}</h1>
        <p>{messages.gallery.intro}</p>
      </section>

      <div className="gallery-grid">
        {messages.gallery.items.map((item) => (
          <div className="gallery-item" key={item.name}>
            <span className="gallery-item__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="gallery-item__name">{item.name}</span>
            <span className="gallery-item__tag">{item.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GalleryPage
