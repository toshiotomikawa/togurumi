import type { SupportedLocale } from './i18n'

export type JournalPost = {
  slug: string
  locale: SupportedLocale
  title: string
  date: string
  summary: string
  order: number
  body: string
}

const rawModules = import.meta.glob('../../content/journal/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parsePost(raw: string): JournalPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const frontmatter = match ? match[1] : ''
  const body = (match ? match[2] : raw).trim()

  const fields: Record<string, string> = {}
  for (const line of frontmatter.split('\n')) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let value = line.slice(sep + 1).trim()
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1)
    }
    fields[key] = value
  }

  return {
    slug: fields.slug ?? '',
    locale: fields.locale === 'pt-BR' ? 'pt-BR' : 'en-US',
    title: fields.title ?? 'Untitled',
    date: fields.date ?? '',
    summary: fields.summary ?? '',
    order: fields.order ? Number(fields.order) : 0,
    body,
  }
}

const allPosts = Object.values(rawModules)
  .map(parsePost)
  .filter((post) => post.slug)
  .sort((a, b) => a.order - b.order || (a.date < b.date ? 1 : -1))

export function getJournalPosts(locale: SupportedLocale): JournalPost[] {
  return allPosts.filter((post) => post.locale === locale)
}

export function getJournalPost(slug: string, locale: SupportedLocale): JournalPost | undefined {
  return allPosts.find((post) => post.slug === slug && post.locale === locale)
}
