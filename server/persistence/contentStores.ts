import pg from 'pg'
import type { FaqStore, SiteContentStore } from './contracts.js'
import { localFaqStore, localSiteContentStore } from './localAdapters.js'
import { PostgresFaqStore, PostgresSiteContentStore } from './postgresContentStores.js'

export function createRuntimeContentStores(databaseUrl = process.env.DATABASE_URL): {
  siteContentStore: SiteContentStore
  faqStore: FaqStore
} {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return { siteContentStore: localSiteContentStore, faqStore: localFaqStore }

  const pool = new pg.Pool({ connectionString })
  return { siteContentStore: new PostgresSiteContentStore(pool), faqStore: new PostgresFaqStore(pool) }
}
