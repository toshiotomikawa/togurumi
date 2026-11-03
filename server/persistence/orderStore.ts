import pg from 'pg'
import { localOrderStore, type OrderStore } from '../orders.js'
import { PostgresOrderStore } from './postgresOrderStore.js'

export function createRuntimeOrderStore(databaseUrl = process.env.DATABASE_URL): OrderStore {
  const connectionString = databaseUrl?.trim()
  if (!connectionString) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production')
    }
    return localOrderStore
  }
  return new PostgresOrderStore(new pg.Pool({ connectionString }))
}
