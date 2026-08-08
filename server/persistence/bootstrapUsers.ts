import 'dotenv/config'
import path from 'node:path'
import pg from 'pg'
import { bootstrapUsers, type BootstrapAccount } from './userBootstrap'
import { localUserStore } from './localAdapters'
import { runMigrations } from './postgres'
import { PostgresUserStore } from './postgresUserStore'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

const accounts: BootstrapAccount[] = [
  { username: required('ADMIN_USERNAME'), password: required('ADMIN_PASSWORD'), role: 'admin' },
  { username: required('MODERATOR_USERNAME'), password: required('MODERATOR_PASSWORD'), role: 'moderator' },
]

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  await bootstrapUsers(localUserStore, accounts)
  console.log('Bootstrapped 2 users in the local store.')
} else {
  const pool = new pg.Pool({ connectionString: databaseUrl })
  const client = await pool.connect()
  try {
    await runMigrations(client, path.resolve('server', 'persistence', 'migrations'))
    await bootstrapUsers(new PostgresUserStore(client), accounts)
  } finally {
    client.release()
    await pool.end()
  }
  console.log('Bootstrapped 2 users in PostgreSQL.')
}
