import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type JournalLocale = 'en-US' | 'pt-BR' | 'es-ES'

export type JournalPostRecord = {
  id: string
  slug: string
  locale: JournalLocale
  title: string
  date: string
  order: number
  summary: string
  archived: boolean
}

export type JournalPostInput = {
  slug: string
  locale: JournalLocale
  title: string
  date: string
  order: number
  summary: string
  body: string
  archived: boolean
}

export type PublicJournalPost = JournalPostRecord & {
  author: string
}

export type PublicJournalPostWithBody = PublicJournalPost & { body: string }

const journalDir = path.resolve('content/journal')

export function isJournalLocale(value: string): value is JournalLocale {
  return value === 'en-US' || value === 'pt-BR' || value === 'es-ES'
}

function idToFilename(id: string) {
  return `${id}.md`
}

export function journalPostId(slug: string, locale: JournalLocale) {
  return locale === 'en-US' ? slug : `${slug}.${locale}`
}

function dataToFilename(slug: string, locale: JournalLocale) {
  return `${journalPostId(slug, locale)}.md`
}

function filenameToId(filename: string) {
  return filename.replace(/\.md$/, '')
}

function unquote(value: string) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  return value
}

function quoteIfNeeded(value: string) {
  if (/[:'"#]|^\s|\s$/.test(value)) {
    return `'${value.replace(/'/g, "''")}'`
  }
  return value
}

function parsePost(id: string, raw: string): PublicJournalPostWithBody {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const frontmatter = match ? match[1] : ''
  const body = (match ? match[2] : raw).trim()

  const fields: Record<string, string> = {}
  for (const line of frontmatter.split('\n')) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    fields[key] = unquote(line.slice(sep + 1).trim())
  }

  const locale = isJournalLocale(fields.locale ?? '') ? (fields.locale as JournalLocale) : 'en-US'

  return {
    id,
    slug: fields.slug ?? '',
    locale,
    title: fields.title ?? 'Untitled',
    date: fields.date ?? '',
    order: fields.order ? Number(fields.order) : 0,
    summary: fields.summary ?? '',
    author: fields.author ?? 'Togurumi',
    archived: fields.archived === 'true',
    body,
  }
}

function serializePost(data: JournalPostInput, author = 'Togurumi'): string {
  const frontmatter = [
    `title: ${quoteIfNeeded(data.title)}`,
    `slug: ${data.slug}`,
    `locale: ${data.locale}`,
    `date: ${data.date}`,
    `order: ${data.order}`,
    `summary: ${quoteIfNeeded(data.summary)}`,
    `author: ${quoteIfNeeded(author)}`,
    `archived: ${data.archived}`,
  ].join('\n')

  return `---\n${frontmatter}\n---\n\n${data.body.trim()}\n`
}

async function listFiles() {
  try {
    const entries = await readdir(journalDir)
    return entries.filter((entry) => entry.endsWith('.md'))
  } catch {
    return []
  }
}

export async function listAllPosts(): Promise<JournalPostRecord[]> {
  const files = await listFiles()
  const posts = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(journalDir, file), 'utf8')
      const { id, slug, locale, title, date, order, summary, archived } = parsePost(filenameToId(file), raw)
      return { id, slug, locale, title, date, order, summary, archived }
    }),
  )
  return posts.sort((a, b) => a.slug.localeCompare(b.slug) || a.locale.localeCompare(b.locale))
}

export async function getPost(id: string): Promise<(JournalPostRecord & { body: string }) | null> {
  try {
    const raw = await readFile(path.join(journalDir, idToFilename(id)), 'utf8')
    const post = parsePost(id, raw)
    return {
      id: post.id, slug: post.slug, locale: post.locale, title: post.title,
      date: post.date, order: post.order, summary: post.summary, archived: post.archived, body: post.body,
    }
  } catch {
    return null
  }
}

async function fileExists(filename: string) {
  try {
    await readFile(path.join(journalDir, filename), 'utf8')
    return true
  } catch {
    return false
  }
}

export class JournalError extends Error {
  constructor(public code: 'slug_exists' | 'invalid_input' | 'not_found') {
    super(code)
  }
}

export function validateJournalInput(data: JournalPostInput) {
  if (!data.slug || !isJournalLocale(data.locale) || !data.title || !data.date || !data.summary) {
    throw new JournalError('invalid_input')
  }
}

export async function createPost(data: JournalPostInput): Promise<JournalPostRecord & { body: string }> {
  validateJournalInput(data)
  const filename = dataToFilename(data.slug, data.locale)

  if (await fileExists(filename)) {
    throw new JournalError('slug_exists')
  }

  await writeFile(path.join(journalDir, filename), serializePost(data), 'utf8')
  return { id: filenameToId(filename), ...data }
}

export async function updatePost(id: string, data: JournalPostInput): Promise<JournalPostRecord & { body: string }> {
  validateJournalInput(data)
  const existingRaw = await readFile(path.join(journalDir, idToFilename(id)), 'utf8').catch(() => null)
  const existing = existingRaw ? parsePost(id, existingRaw) : null
  if (!existing) throw new JournalError('not_found')

  const newFilename = dataToFilename(data.slug, data.locale)
  const oldFilename = idToFilename(id)

  if (newFilename !== oldFilename && (await fileExists(newFilename))) {
    throw new JournalError('slug_exists')
  }

  await writeFile(path.join(journalDir, newFilename), serializePost(data, existing.author), 'utf8')
  if (newFilename !== oldFilename) {
    await rm(path.join(journalDir, oldFilename))
  }

  return { id: filenameToId(newFilename), ...data }
}

export async function deletePost(id: string): Promise<boolean> {
  const filename = idToFilename(id)
  if (!(await fileExists(filename))) return false
  await rm(path.join(journalDir, filename))
  return true
}

export async function setPostArchived(id: string, archived: boolean): Promise<JournalPostRecord & { body: string }> {
  const existingRaw = await readFile(path.join(journalDir, idToFilename(id)), 'utf8').catch(() => null)
  const existing = existingRaw ? parsePost(id, existingRaw) : null
  if (!existing) throw new JournalError('not_found')

  const data: JournalPostInput = {
    slug: existing.slug,
    locale: existing.locale,
    title: existing.title,
    date: existing.date,
    order: existing.order,
    summary: existing.summary,
    body: existing.body,
    archived,
  }

  await writeFile(path.join(journalDir, idToFilename(id)), serializePost(data, existing.author), 'utf8')
  return { id, ...data }
}

export async function listPublicPosts(
  locale: JournalLocale,
  author?: string,
  includeArchived = false,
): Promise<PublicJournalPost[]> {
  const files = await listFiles()
  const posts = await Promise.all(files.map(async (file) =>
    parsePost(filenameToId(file), await readFile(path.join(journalDir, file), 'utf8')),
  ))
  return posts
    .filter((post) => post.locale === locale && (includeArchived || !post.archived))
    .filter((post) => !author || post.author.toLowerCase() === author.toLowerCase())
    .sort((a, b) => a.order - b.order || (a.date < b.date ? 1 : -1))
    .map((post) => ({
      id: post.id, slug: post.slug, locale: post.locale, title: post.title,
      date: post.date, order: post.order, summary: post.summary,
      author: post.author, archived: post.archived,
    }))
}

export async function getPublicPost(
  slug: string,
  locale: JournalLocale,
  includeArchived = false,
): Promise<PublicJournalPostWithBody | null> {
  const posts = await listPublicPosts(locale, undefined, includeArchived)
  const match = posts.find((post) => post.slug === slug)
  if (!match) return null
  const raw = await readFile(path.join(journalDir, idToFilename(match.id)), 'utf8')
  return parsePost(match.id, raw)
}
