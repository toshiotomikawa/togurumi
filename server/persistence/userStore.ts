import pg from 'pg'
import type { UserStore } from './contracts.js'
import { localUserStore } from './localAdapters.js'
import { PostgresUserStore } from './postgresUserStore.js'

export function createRuntimeUserStore(databaseUrl = process.env.DATABASE_URL): UserStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localUserStore
  return new PostgresUserStore(new pg.Pool({ connectionString }))
}
