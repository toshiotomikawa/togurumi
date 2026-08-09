import pg from 'pg'
import type { JournalStore } from './contracts.js'
import { localJournalStore } from './localAdapters.js'
import { PostgresJournalStore } from './postgresJournalStore.js'

export function createRuntimeJournalStore(databaseUrl = process.env.DATABASE_URL): JournalStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localJournalStore
  return new PostgresJournalStore(new pg.Pool({ connectionString }))
}
