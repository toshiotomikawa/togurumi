import type { SupportedLocale } from './i18n'

export type JournalPost = {
  id: string
  slug: string
  locale: SupportedLocale
  title: string
  date: string
  summary: string
  order: number
  body: string
  author: string
  archived: boolean
}

const rawModules = import.meta.glob('../../content/journal/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parsePost(id: string, raw: string): JournalPost {
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
    id,
    slug: fields.slug ?? '',
    locale: fields.locale === 'pt-BR' || fields.locale === 'es-ES' ? fields.locale : 'en-US',
    title: fields.title ?? 'Untitled',
    date: fields.date ?? '',
    summary: fields.summary ?? '',
    order: fields.order ? Number(fields.order) : 0,
    body,
    author: fields.author ?? 'Bella',
    archived: fields.archived === 'true',
  }
}

const allPosts = Object.entries(rawModules)
  .map(([path, raw]) => parsePost(path.replace(/^.*\//, '').replace(/\.md$/, ''), raw))
  .filter((post) => post.slug)
  .sort((a, b) => a.order - b.order || (a.date < b.date ? 1 : -1))

export function getJournalPosts(locale: SupportedLocale, author?: string, includeArchived = false): JournalPost[] {
  return allPosts.filter(
    (post) =>
      post.locale === locale &&
      (includeArchived || !post.archived) &&
      (!author || post.author.toLowerCase() === author.toLowerCase()),
  )
}

export function getJournalPost(slug: string, locale: SupportedLocale): JournalPost | undefined {
  return allPosts.find((post) => post.slug === slug && post.locale === locale && !post.archived)
}
