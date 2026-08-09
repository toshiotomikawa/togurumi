import pg from 'pg'
import type { ReviewStore } from './contracts.js'
import { localReviewStore } from './localAdapters.js'
import { PostgresReviewStore } from './postgresReviewStore.js'

export function createRuntimeReviewStore(databaseUrl = process.env.DATABASE_URL): ReviewStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localReviewStore
  return new PostgresReviewStore(new pg.Pool({ connectionString }))
}
