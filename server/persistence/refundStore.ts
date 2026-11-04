import pg from 'pg'
import { localRefundStore, type RefundStore } from '../refunds.js'
import { PostgresRefundStore } from './postgresRefundStore.js'

export function createRuntimeRefundStore(databaseUrl = process.env.DATABASE_URL): RefundStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) return localRefundStore
  return new PostgresRefundStore(new pg.Pool({ connectionString }))
}
