import type { Pool, PoolClient, QueryResultRow } from 'pg'
import {
  FaqError,
  getFaqDefaults,
  isFaqLocale,
  normalizeFaqUpdate,
  type FaqContent,
} from '../faq.js'
import {
  getSiteContentDefaults,
  isSiteContentLocale,
  isSiteContentSection,
  normalizeSiteContentUpdate,
  SiteContentError,
  type SiteContentValues,
} from '../siteContent.js'
import type { FaqStore, SiteContentStore } from './contracts.js'

type DatabaseClient = Pool | PoolClient
type ContentRow = QueryResultRow & { content: Record<string, unknown> }

export class PostgresSiteContentStore implements SiteContentStore {
  constructor(private readonly db: DatabaseClient) {}

  async get(locale: string, section: string): Promise<SiteContentValues> {
    if (!isSiteContentLocale(locale)) throw new SiteContentError('invalid_locale')
    if (!isSiteContentSection(section)) throw new SiteContentError('invalid_section')

    const result = await this.db.query<ContentRow>(
      'SELECT content FROM site_content WHERE locale = $1 AND section = $2',
      [locale, section],
    )
    return { ...getSiteContentDefaults(locale, section), ...(result.rows[0]?.content ?? {}) } as SiteContentValues
  }

  async update(locale: string, section: string, content: unknown): Promise<SiteContentValues> {
    if (!isSiteContentLocale(locale)) throw new SiteContentError('invalid_locale')
    if (!isSiteContentSection(section)) throw new SiteContentError('invalid_section')
    const next = normalizeSiteContentUpdate(section, content)

    await this.db.query(
      `INSERT INTO site_content (locale, section, content)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (locale, section) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [locale, section, JSON.stringify(next)],
    )
    return next
  }
}

export class PostgresFaqStore implements FaqStore {
  constructor(private readonly db: DatabaseClient) {}

  async get(locale: string): Promise<FaqContent> {
    if (!isFaqLocale(locale)) throw new FaqError('invalid_locale')
    const result = await this.db.query<ContentRow>('SELECT content FROM faq_content WHERE locale = $1', [locale])
    return (result.rows[0]?.content as FaqContent | undefined) ?? getFaqDefaults(locale)
  }

  async update(locale: string, content: unknown): Promise<FaqContent> {
    if (!isFaqLocale(locale)) throw new FaqError('invalid_locale')
    const next = normalizeFaqUpdate(content)
    await this.db.query(
      `INSERT INTO faq_content (locale, content)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (locale) DO UPDATE SET content = EXCLUDED.content, updated_at = now()`,
      [locale, JSON.stringify(next)],
    )
    return next
  }
}
