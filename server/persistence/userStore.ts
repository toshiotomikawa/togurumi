import pg from 'pg'
import type { UserStore } from './contracts'
import { localUserStore } from './localAdapters'
import { PostgresUserStore } from './postgresUserStore'

export function createRuntimeUserStore(databaseUrl = process.env.DATABASE_URL): UserStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localUserStore
  return new PostgresUserStore(new pg.Pool({ connectionString }))
}
