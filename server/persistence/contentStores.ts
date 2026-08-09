import pg from 'pg'
import type { FaqStore, SiteContentStore } from './contracts'
import { localFaqStore, localSiteContentStore } from './localAdapters'
import { PostgresFaqStore, PostgresSiteContentStore } from './postgresContentStores'

export function createRuntimeContentStores(databaseUrl = process.env.DATABASE_URL): {
  siteContentStore: SiteContentStore
  faqStore: FaqStore
} {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return { siteContentStore: localSiteContentStore, faqStore: localFaqStore }

  const pool = new pg.Pool({ connectionString })
  return { siteContentStore: new PostgresSiteContentStore(pool), faqStore: new PostgresFaqStore(pool) }
}
