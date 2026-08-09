import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getMessages } from '../src/i18n/messages.js'
import { SITE_CONTENT_FIELDS, type SiteContentSection } from '../src/lib/siteContent.js'

export type SiteContentLocale = 'en-US' | 'pt-BR' | 'es-ES'

const LOCALES: SiteContentLocale[] = ['en-US', 'pt-BR', 'es-ES']
const SECTIONS = Object.keys(SITE_CONTENT_FIELDS) as SiteContentSection[]

export type SiteContentValues = Record<string, string>
type SiteContent = Record<SiteContentSection, SiteContentValues>
type SiteContentDatabase = Record<SiteContentLocale, SiteContent>

const contentPath = path.resolve('content', 'site-content.json')

export class SiteContentError extends Error {
  constructor(public code: 'invalid_locale' | 'invalid_section' | 'invalid_content') {
    super(code)
  }
}

export function isSiteContentLocale(value: string): value is SiteContentLocale {
  return value === 'en-US' || value === 'pt-BR' || value === 'es-ES'
}

export function isSiteContentSection(value: string): value is SiteContentSection {
  return (SECTIONS as string[]).includes(value)
}

function buildDefaults(locale: SiteContentLocale): SiteContent {
  const messages = getMessages(locale)
  const source: Record<SiteContentSection, Record<string, unknown>> = {
    home: messages.home,
    about: messages.about,
    contact: messages.contact,
    shop: messages.shop,
    journal: messages.journal,
    reviews: messages.reviews,
  }

  const content = {} as SiteContent
  for (const section of SECTIONS) {
    const values: SiteContentValues = {}
    for (const field of SITE_CONTENT_FIELDS[section] as string[]) {
      const value = source[section][field]
      if (typeof value === 'string') values[field] = value
    }
    content[section] = values
  }
  return content
}

const DEFAULTS: SiteContentDatabase = {
  'en-US': buildDefaults('en-US'),
  'pt-BR': buildDefaults('pt-BR'),
  'es-ES': buildDefaults('es-ES'),
}

export function getSiteContentDefaults(locale: SiteContentLocale, section: SiteContentSection): SiteContentValues {
  return DEFAULTS[locale][section]
}

export function normalizeSiteContentUpdate(section: SiteContentSection, content: unknown): SiteContentValues {
  const data = content as Record<string, unknown> | null
  if (!data || typeof data !== 'object') throw new SiteContentError('invalid_content')

  const fields = SITE_CONTENT_FIELDS[section] as string[]
  const next: SiteContentValues = {}
  for (const field of fields) {
    const value = data[field]
    if (typeof value !== 'string' || !value.trim()) throw new SiteContentError('invalid_content')
    next[field] = value
  }
  return next
}

async function loadDb(): Promise<SiteContentDatabase> {
  let parsed: Partial<Record<SiteContentLocale, Partial<SiteContent>>>

  try {
    const raw = await readFile(contentPath, 'utf8')
    parsed = JSON.parse(raw) as Partial<Record<SiteContentLocale, Partial<SiteContent>>>
  } catch {
    parsed = {}
  }

  const db = {} as SiteContentDatabase
  for (const locale of LOCALES) {
    db[locale] = {} as SiteContent
    for (const section of SECTIONS) {
      db[locale][section] = { ...DEFAULTS[locale][section], ...parsed[locale]?.[section] }
    }
  }
  return db
}

async function writeDb(db: SiteContentDatabase) {
  await writeFile(contentPath, JSON.stringify(db, null, 2), 'utf8')
}

export async function getSiteContentSection(locale: string, section: string): Promise<SiteContentValues> {
  if (!isSiteContentLocale(locale)) throw new SiteContentError('invalid_locale')
  if (!isSiteContentSection(section)) throw new SiteContentError('invalid_section')

  const db = await loadDb()
  return db[locale][section]
}

export async function updateSiteContentSection(locale: string, section: string, content: unknown): Promise<SiteContentValues> {
  if (!isSiteContentLocale(locale)) throw new SiteContentError('invalid_locale')
  if (!isSiteContentSection(section)) throw new SiteContentError('invalid_section')

  const next = normalizeSiteContentUpdate(section, content)

  const db = await loadDb()
  db[locale][section] = next
  await writeDb(db)
  return next
}
