import pg from 'pg'
import type { JournalStore } from './contracts'
import { localJournalStore } from './localAdapters'
import { PostgresJournalStore } from './postgresJournalStore'

export function createRuntimeJournalStore(databaseUrl = process.env.DATABASE_URL): JournalStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localJournalStore
  return new PostgresJournalStore(new pg.Pool({ connectionString }))
}
