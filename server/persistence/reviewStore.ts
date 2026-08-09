import pg from 'pg'
import type { ReviewStore } from './contracts'
import { localReviewStore } from './localAdapters'
import { PostgresReviewStore } from './postgresReviewStore'

export function createRuntimeReviewStore(databaseUrl = process.env.DATABASE_URL): ReviewStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localReviewStore
  return new PostgresReviewStore(new pg.Pool({ connectionString }))
}
