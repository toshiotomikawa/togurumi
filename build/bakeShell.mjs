/**
 * Runs after the client and shell builds. It reads the live catalog and published text, draws the
 * header and the opening of the home and shop pages in each language (src/shell.tsx), and writes:
 *   index.html  the home page, with its opening drawn in and its hero photos requested at once
 *   shop.html   the same for /shop (vercel.json routes /shop here)
 *   app.html    the plain app for every other page (vercel.json's fallback)
 * If the live data cannot be read, all three are the plain app and the site works as before.
 */
import { readFile, rm, writeFile } from 'node:fs/promises'

const SITE = 'https://togurumi.vercel.app'
const LOCALES = ['pt-BR', 'en-US', 'es-ES']
const dist = new URL('../dist/', import.meta.url)
const ssrDir = new URL('./.ssr/', import.meta.url)

const plain = await readFile(new URL('index.html', dist), 'utf8')

async function getJson(path) {
  const response = await fetch(SITE + path, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return response.json()
}

// Text inside <script> must not be able to close it.
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c')
const attr = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// The AVIF set the page's <picture> offers; browsers without AVIF skip this hint and load the photo itself.
function preload(image, sizes, fallbackWidth, shell) {
  const avif = shell.avifSrcSet(image)
  if (!avif) return `<link rel="preload" as="image" href="${attr(shell.photoProps(image, sizes, fallbackWidth).src)}" fetchpriority="high">`
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${attr(avif)}" imagesizes="${attr(sizes)}" fetchpriority="high">`
}

// The language the head script picked decides which drawing goes into the page.
const pickShell = '<script>(function () { var root = document.getElementById("root"); document.querySelectorAll("template[data-shell]").forEach(function (t) { if (t.dataset.shell === document.documentElement.lang) root.append(t.content); t.remove() }) })()</script>'

function page(head, body = '') {
  return plain.replace('<!-- shell-head -->', head).replace('<!-- shell-body -->', body)
}

// A drawn page is already readable, so the app downloads once the page has loaded, leaving a
// slow connection to the photo and fonts first. Its links work before then; its buttons wait.
function startAppAfterLoad(html) {
  const app = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
  if (!app) return html
  const start = `<script>addEventListener("load", function () { var s = document.createElement("script"); s.type = "module"; s.src = ${JSON.stringify(app[1])}; document.body.append(s) })</script>`
  return html.replace(app[0], '').replace(/\s*<link rel="modulepreload"[^>]*>/g, '').replace('</body>', start + '\n  </body>')
}

try {
  const shell = await import(new URL('shell.js', ssrDir).href)
  const { products = [] } = await getJson('/api/shop/products')
  const content = {}
  for (const locale of LOCALES) {
    content[locale] = {}
    for (const section of ['home', 'shop']) content[locale][section] = (await getJson(`/api/content/${locale}/${section}`)).content
  }
  const onlyPhoto = ({ name, image }) => ({ name, image })
  const pieces = shell.pickHeroPieces(products).map(onlyPhoto)
  // The same cover rule as the shop page.
  const cover = products.find(product => product.image && product.stock > 0)
  const seed = { pieces, cover: cover && onlyPhoto(cover), content }
  globalThis.__togurumiSeed = seed

  const seedScript = `<script>window.__togurumiSeed = ${safeJson(seed)}</script>`
  const preconnect = '<link rel="preconnect" href="https://ik.imagekit.io">'
  const drawn = name => LOCALES.map(locale => `<template data-shell="${locale}">${shell.renderShell(name, locale)}</template>`).join('') + pickShell

  const heroHints = pieces.slice(0, 1).map(piece => preload(piece.image, shell.HERO_PHOTO_SIZES, 720, shell))
  const coverHints = cover ? [preload(cover.image, shell.SHOP_COVER_SIZES, 960, shell)] : []
  await writeFile(new URL('index.html', dist), startAppAfterLoad(page([preconnect, ...heroHints, seedScript].join('\n    '), drawn('home'))))
  await writeFile(new URL('shop.html', dist), startAppAfterLoad(page([preconnect, ...coverHints, seedScript].join('\n    '), drawn('shop'))))
  await writeFile(new URL('app.html', dist), page([preconnect, seedScript].join('\n    ')))
  console.log(`shell: home and shop drawn in ${LOCALES.length} languages`)
} catch (error) {
  console.warn('shell: skipped, the pages load as the plain app:', error instanceof Error ? error.message : error)
  for (const name of ['index.html', 'shop.html', 'app.html']) await writeFile(new URL(name, dist), page(''))
} finally {
  await rm(ssrDir, { recursive: true, force: true })
}
