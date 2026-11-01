import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { FaqContent } from '../faq.js'
import type { JournalLocale } from '../journal.js'
import type { UserRecord } from '../store.js'

export type LegacyReview = {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: number
}

export type LegacySiteContent = {
  locale: string
  section: string
  content: Record<string, string>
}

export type LegacyFaq = { locale: string; content: FaqContent }

export type LegacyJournalPost = {
  id: string
  slug: string
  locale: JournalLocale
  title: string
  date: string
  order: number
  summary: string
  body: string
  author: string
  archived: boolean
}

export type LegacySnapshot = {
  users: UserRecord[]
  reviews: LegacyReview[]
  siteContent: LegacySiteContent[]
  faq: LegacyFaq[]
  journal: LegacyJournalPost[]
}

export type ImportCounts = Record<keyof LegacySnapshot, number>

export interface LegacyImportSink {
  upsertUser(user: UserRecord): Promise<void>
  upsertReview(review: LegacyReview): Promise<void>
  upsertSiteContent(entry: LegacySiteContent): Promise<void>
  upsertFaq(entry: LegacyFaq): Promise<void>
  upsertJournalPost(post: LegacyJournalPost): Promise<void>
}

function deterministicUuid(namespace: string, value: string) {
  const hex = createHash('sha256').update(`${namespace}:${value}`).digest('hex').slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16)
  const joined = hex.join('')
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filename, 'utf8')) as T
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return fallback
    throw error
  }
}

function unquote(value: string) {
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  return value
}

function parseJournal(filename: string, raw: string): LegacyJournalPost {
  const source = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const fields: Record<string, string> = {}
  for (const line of (match?.[1] ?? '').split('\n')) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    fields[line.slice(0, separator).trim()] = unquote(line.slice(separator + 1).trim())
  }

  const locale = fields.locale === 'pt-BR' || fields.locale === 'es-ES' ? fields.locale : 'en-US'
  return {
    id: filename.replace(/\.md$/, ''),
    slug: fields.slug ?? '',
    locale,
    title: fields.title ?? 'Untitled',
    date: fields.date ?? '',
    order: Number(fields.order ?? 0),
    summary: fields.summary ?? '',
    body: (match?.[2] ?? source).trim(),
    author: fields.author ?? 'Togurumi',
    archived: fields.archived === 'true',
  }
}

export async function loadLegacySnapshot(root: string): Promise<LegacySnapshot> {
  const usersDb = await readJson<{ users?: Partial<UserRecord>[] }>(path.join(root, 'data', 'users.json'), {})
  const users = (usersDb.users ?? []).map((user, index) => ({
    id: user.id ?? deterministicUuid('user', user.username ?? String(index)),
    username: user.username ?? 'user',
    displayName: user.displayName ?? user.username ?? 'user',
    createdAt: user.createdAt ?? 0,
    passwordHash: user.passwordHash ?? null,
    googleId: user.googleId ?? null,
    email: user.email ?? null,
    role: user.role === 'admin' ? 'admin' as const : 'moderator' as const,
  }))

  const reviewsDb = await readJson<{ reviews?: Partial<LegacyReview>[] }>(
    path.join(root, 'content', 'reviews.json'),
    {},
  )
  const reviews = (reviewsDb.reviews ?? []).map((review, index) => ({
    id: review.id ?? deterministicUuid('review', `${review.name ?? ''}:${review.createdAt ?? index}`),
    name: review.name ?? '',
    rating: review.rating ?? 5,
    comment: review.comment ?? '',
    createdAt: review.createdAt ?? 0,
  }))

  const contentDb = await readJson<Record<string, Record<string, Record<string, string>>>>(
    path.join(root, 'content', 'site-content.json'),
    {},
  )
  const siteContent = Object.entries(contentDb).flatMap(([locale, sections]) =>
    Object.entries(sections).map(([section, content]) => ({ locale, section, content })),
  )

  const faqDb = await readJson<Record<string, FaqContent>>(path.join(root, 'content', 'faq.json'), {})
  const faq = Object.entries(faqDb).map(([locale, content]) => ({ locale, content }))

  const journalDir = path.join(root, 'content', 'journal')
  const journalFiles = (await readdir(journalDir)).filter((filename) => filename.endsWith('.md')).sort()
  const journal = await Promise.all(
    journalFiles.map(async (filename) => parseJournal(filename, await readFile(path.join(journalDir, filename), 'utf8'))),
  )

  return { users, reviews, siteContent, faq, journal }
}

export function countSnapshot(snapshot: LegacySnapshot): ImportCounts {
  return {
    users: snapshot.users.length,
    reviews: snapshot.reviews.length,
    siteContent: snapshot.siteContent.length,
    faq: snapshot.faq.length,
    journal: snapshot.journal.length,
  }
}

export async function importLegacySnapshot(snapshot: LegacySnapshot, sink: LegacyImportSink): Promise<ImportCounts> {
  for (const user of snapshot.users) await sink.upsertUser(user)
  for (const review of snapshot.reviews) await sink.upsertReview(review)
  for (const entry of snapshot.siteContent) await sink.upsertSiteContent(entry)
  for (const entry of snapshot.faq) await sink.upsertFaq(entry)
  for (const post of snapshot.journal) await sink.upsertJournalPost(post)
  return countSnapshot(snapshot)
}
