import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { runMigrations } from './postgres.js'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const connectionString = process.env.DATABASE_URL?.trim()
if (!connectionString) throw new Error('DATABASE_URL is required')

const pool = new pg.Pool({ connectionString })
const client = await pool.connect()
try {
  await runMigrations(client, path.join(root, 'server', 'persistence', 'migrations'))
  console.log('Migrations applied.')
} finally {
  client.release()
  await pool.end()
}
