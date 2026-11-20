/**
 * Runs first in `npm run build`: every font size in the stylesheets must be one of the type-scale
 * tokens (--text-* in src/index.css, listed in DESIGN.md), or relative to its parent (em, %, inherit).
 * A fixed size anywhere else fails the build, so a stray 11px cannot reach the site.
 */
import { readFile } from 'node:fs/promises'

const SHEETS = ['src/index.css', 'src/pages/atelier-v6.css', 'src/pages/home-v5.css', 'src/pages/studio-v5.css']

// Text drawn as artwork, not read as copy.
const ALLOWED = new Set([
  '.product-detail__seal-words small', // the round "handmade" stamp on a product photo, aria-hidden
  '.product-detail__seal-words strong',
])

const relative = /^(inherit|\d*\.?\d+(em|%))$/
const token = /^var\(--text-(sm|md|lg|xl|2xl|3xl)\)$/

const problems = []
for (const sheet of SHEETS) {
  const css = await readFile(new URL(`../${sheet}`, import.meta.url), 'utf8')
  // Each rule: selector { declarations }. Comments are stripped first; nested at-rules are fine because
  // only the innermost selector before a declaration block matters.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const rule of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim().replace(/\s+/g, ' ')
    const line = clean.slice(0, rule.index + rule[1].length).split('\n').length
    for (const decl of rule[2].split(';')) {
      const match = /^\s*(font-size|font)\s*:\s*(.+?)\s*$/.exec(decl)
      if (!match) continue
      const value = match[2].replace(/\s*!important$/, '')
      if (match[1] === 'font') {
        if (value === 'inherit') continue
        // The shorthand's size is the part before "/line-height" or the family.
        const size = /(var\(--text-[a-z0-9]+\)|\d*\.?\d+(px|rem|em|%)|clamp\([^)]*\))/.exec(value)?.[0]
        if (size && (token.test(size) || relative.test(size))) continue
        if (!ALLOWED.has(selector)) problems.push(`${sheet}:${line} ${selector} { font: ${value} }`)
        continue
      }
      if (token.test(value) || relative.test(value) || ALLOWED.has(selector)) continue
      problems.push(`${sheet}:${line} ${selector} { font-size: ${value} }`)
    }
  }
}

if (problems.length) {
  console.error(`type scale: ${problems.length} font sizes are off the scale (use var(--text-*)):\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('type scale: every font size is on the scale')
