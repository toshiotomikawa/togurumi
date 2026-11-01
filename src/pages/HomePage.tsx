import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EditActions, EditFeedback, EditField } from '../components/EditableContent'
import ReviewsSection from '../components/ReviewsSection'
import { useEditableContent } from '../hooks/useEditableContent'
import { useLocale } from '../hooks/useLocale'
import { useJournalPosts } from '../hooks/useJournal'
import { useShopProducts } from '../hooks/useShopProducts'
import { formatPrice, type ShopProduct } from '../lib/shop'
import { slugify } from '../lib/slug'
import { TOGURUMI_INSTAGRAM_DM, TOGURUMI_LATEST_VIDEO, TOGURUMI_YOUTUBE } from '../lib/togurumi'

const copy = {
  'pt-BR': { commission: 'Encomendas', collection: 'Encontre seu novo amiguinho', collectionIntro: 'Uma pequena seleção do ateliê. Cada peça, um encontro.', categories: 'Qual é o seu tipo de encanto?', about: 'Um fio, uma agulha. E a Bella.', handmade: 'Feitos à mão', maker: 'Da agulha da Bella', order: 'Encomendas pelo Instagram', explore: 'Conhecer a coleção', browse: 'Explorar', sign: 'Com carinho, Bella', studio: 'Por dentro do ateliê' },
  'en-US': { commission: 'Custom pieces', collection: 'Meet your new little friend', collectionIntro: 'A little selection from the studio. Every piece, a connection.', categories: 'What kind of charm is yours?', about: 'Some yarn, a hook. And Bella.', handmade: 'Made by hand', maker: "From Bella’s hook", order: 'Custom orders on Instagram', explore: 'Meet the collection', browse: 'Explore', sign: 'With love, Bella', studio: 'Inside the studio' },
  'es-ES': { commission: 'Encargos', collection: 'Encuentra a tu nuevo amiguito', collectionIntro: 'Una pequeña selección del taller. Cada pieza, un encuentro.', categories: '¿Cuál es tu tipo de encanto?', about: 'Un hilo, una aguja. Y Bella.', handmade: 'Hechos a mano', maker: 'De la aguja de Bella', order: 'Encargos por Instagram', explore: 'Conocer la colección', browse: 'Explorar', sign: 'Con cariño, Bella', studio: 'Dentro del taller' },
}

function PiecePhoto({ product, className = '', eager = false }: { product: ShopProduct; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const { messages } = useLocale()
  return product.image && failed !== product.image ? (
    <img className={className} src={product.image} alt={product.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(product.image)} />
  ) : <div className={`v5-photo-fallback ${className}`} role="img" aria-label={messages.shop.photoComingSoon}>{messages.shop.photoComingSoon}</div>
}

function HomePiece({ product }: { product: ShopProduct }) {
  const { messages, locale } = useLocale()
  return (
    <article className="v5-piece">
      <Link className="v5-piece__photo" to={`/shop/${slugify(product.name)}`} tabIndex={-1} aria-hidden="true"><PiecePhoto product={product} /></Link>
      <div className="v5-piece__info">
        <h3><Link to={`/shop/${slugify(product.name)}`}>{product.name}</Link></h3>
        <span className="v5-piece__price">{formatPrice(product.price, locale)}</span>
        <p>{product.stock > 0 ? `${messages.shop.stockLabel}: ${product.stock}` : messages.shop.outOfStock}</p>
        {product.designer && <p className="v5-piece__credit">{messages.shop.designerLabel}: {product.designer}</p>}
      </div>
    </article>
  )
}

function HomePage() {
  const { messages, locale } = useLocale()
  const t = copy[locale]
  const { products, loaded } = useShopProducts()
  const { posts, error: journalError } = useJournalPosts(locale)
  const latest = posts[0]
  const editor = useEditableContent('home', locale, messages.home, messages.contentEditor.draftRestored)
  const photographed = products.filter(product => product.image)
  const available = photographed.filter(product => product.stock > 0)
  const selected = [...available.filter(product => product.highlight), ...available.filter(product => !product.highlight)].slice(0, 6)
  const browseLinks = [
    { label: messages.shop.availableHeading, to: '/shop', product: selected[2] },
    { label: photographed[0]?.category, to: `/search?category=${encodeURIComponent(photographed[0]?.category ?? '')}`, product: selected[4] },
    { label: t.commission, to: '/contact', product: selected[1] },
  ].filter(item => item.product && item.label)

  return (
    <div className="v5-home">
      {editor.editing && editor.draft ? <section className="v5-editor v5-wrap">
          <div className="content-editor__fields">
            <EditField
              label={messages.contentEditor.fields.eyebrow}
              value={editor.draft.eyebrow}
              onChange={(value) => editor.updateField('eyebrow', value)}
            />
            <EditField
              label={messages.contentEditor.fields.title}
              value={editor.draft.title}
              onChange={(value) => editor.updateField('title', value)}
            />
            <EditField
              label={messages.contentEditor.fields.intro}
              value={editor.draft.intro}
              multiline
              onChange={(value) => editor.updateField('intro', value)}
            />
            <EditField
              label={messages.contentEditor.fields.shopCta}
              value={editor.draft.shopCta}
              onChange={(value) => editor.updateField('shopCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.journalCta}
              value={editor.draft.journalCta}
              onChange={(value) => editor.updateField('journalCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.highlightsHeading}
              value={editor.draft.highlightsHeading}
              onChange={(value) => editor.updateField('highlightsHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.storeHeading}
              value={editor.draft.storeHeading}
              onChange={(value) => editor.updateField('storeHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.viewAll}
              value={editor.draft.viewAll}
              onChange={(value) => editor.updateField('viewAll', value)}
            />
            <EditField
              label={messages.contentEditor.fields.journalHeading}
              value={editor.draft.journalHeading}
              onChange={(value) => editor.updateField('journalHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.allEntries}
              value={editor.draft.allEntries}
              onChange={(value) => editor.updateField('allEntries', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeHeading}
              value={editor.draft.youtubeHeading}
              onChange={(value) => editor.updateField('youtubeHeading', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeIntro}
              value={editor.draft.youtubeIntro}
              multiline
              onChange={(value) => editor.updateField('youtubeIntro', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeVideoCta}
              value={editor.draft.youtubeVideoCta}
              onChange={(value) => editor.updateField('youtubeVideoCta', value)}
            />
            <EditField
              label={messages.contentEditor.fields.youtubeChannelCta}
              value={editor.draft.youtubeChannelCta}
              onChange={(value) => editor.updateField('youtubeChannelCta', value)}
            />
          </div>
      </section> : <section className="v5-welcome">
        <div className="v5-wrap">
          <div className="v5-welcome__words">
            <h1>{editor.content.title}</h1>
            <p>{editor.content.intro}</p>
            <Link className="v5-button" to="/shop">{editor.content.shopCta}</Link>
          </div>
          <div className="v5-portrait-row" aria-busy={!loaded}>
            {selected.slice(0, 3).map((product, index) => <figure className={`v5-portrait v5-portrait--${index}`} key={product.name}>
              <Link to={`/shop/${slugify(product.name)}`}><PiecePhoto product={product} eager /><figcaption>{product.name}</figcaption></Link>
            </figure>)}
            {!loaded && [0, 1, 2].map(i => <div className="v5-portrait v5-loading" key={i} aria-hidden="true" />)}
          </div>
        </div>
      </section>}

      {editor.canEdit && <div className="v5-wrap"><EditActions editLabel={messages.contentEditor.editButton} saveLabel={messages.contentEditor.save} cancelLabel={messages.contentEditor.cancel} editing={editor.editing} saving={editor.saving} onEdit={editor.startEditing} onSave={() => void editor.save(messages.contentEditor)} onCancel={editor.cancelEditing} /></div>}
      <div className="v5-wrap"><EditFeedback feedback={editor.feedback} /></div>

      <div className="v5-values"><div className="v5-wrap"><span>{t.handmade}</span><span>{t.maker}</span><a href={TOGURUMI_INSTAGRAM_DM} target="_blank" rel="noopener noreferrer">{t.order}</a></div></div>

      <section className="v5-collection v5-wrap" aria-labelledby="collection-title">
        <div className="v5-section-heading"><div><h2 id="collection-title">{t.collection}</h2><p>{t.collectionIntro}</p></div><Link className="v5-text-link" to="/shop">{t.explore}</Link></div>
        {!loaded ? <div className="v5-pieces" aria-busy="true" aria-label={messages.shop.loadingLabel}>{[0, 1, 2].map(i => <div className="v5-loading" key={i} />)}</div> : selected.length ? <div className="v5-pieces">{selected.map(product => <HomePiece key={product.name} product={product} />)}</div> : <div className="v5-empty"><h3>{messages.shop.emptyTitle}</h3><p>{messages.shop.availableEmpty}</p><Link className="v5-button" to="/shop">{editor.content.shopCta}</Link></div>}
      </section>

      {browseLinks.length > 0 && <section className="v5-categories" aria-labelledby="categories-title"><div className="v5-wrap"><h2 id="categories-title">{t.categories}</h2><div className="v5-category-grid">{browseLinks.map(item => <Link className="v5-category" to={item.to} key={item.to}><PiecePhoto product={item.product} /><div><h3>{item.label}</h3><span>{t.browse}</span></div></Link>)}</div></div></section>}

      <section className="v5-maker"><div className="v5-wrap v5-maker__layout">
        <div className="v5-maker__photo">{selected[3] && <PiecePhoto product={selected[3]} />}<span className="v5-maker__signature">Bella</span></div>
        <div className="v5-maker__story"><h2>{t.about}</h2><p>{editor.content.intro}</p><p>{editor.content.youtubeIntro}</p><span className="v5-maker__sign">{t.sign}</span><div className="v5-maker__actions"><a className="v5-button" href={TOGURUMI_LATEST_VIDEO} target="_blank" rel="noopener noreferrer">{editor.content.youtubeVideoCta}</a><a className="v5-text-link" href={TOGURUMI_YOUTUBE} target="_blank" rel="noopener noreferrer">{editor.content.youtubeChannelCta}</a></div></div>
      </div></section>

      <section className="v5-journal v5-wrap"><div><h2>{editor.content.journalHeading}</h2><Link className="v5-text-link" to="/journal">{editor.content.journalCta}</Link></div>{journalError ? <p role="alert">{messages.auth.genericError}</p> : latest ? <Link className="v5-journal__entry" to={`/journal/${latest.slug}`}><h3>{latest.title}</h3><p>{latest.summary}</p><span>{latest.date}</span></Link> : <p>{editor.content.youtubeIntro}</p>}</section>
      <div className="v5-reviews v5-wrap"><ReviewsSection /></div>
    </div>
  )
}
export default HomePage
