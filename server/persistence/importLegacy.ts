import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { countSnapshot, importLegacySnapshot, loadLegacySnapshot } from './legacyImport'
import { PostgresLegacyImportSink, runMigrations } from './postgres'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const snapshot = await loadLegacySnapshot(root)
const counts = countSnapshot(snapshot)
const apply = process.argv.includes('--apply')

if (!apply) {
  console.log(JSON.stringify({ mode: 'dry-run', counts }, null, 2))
  process.exit(0)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required with --apply')

const pool = new pg.Pool({ connectionString })
const client = await pool.connect()
try {
  await runMigrations(client, path.join(root, 'server', 'persistence', 'migrations'))
  await client.query('BEGIN')
  try {
    await importLegacySnapshot(snapshot, new PostgresLegacyImportSink(client))
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
  console.log(JSON.stringify({ mode: 'apply', counts }, null, 2))
} finally {
  client.release()
  await pool.end()
}
