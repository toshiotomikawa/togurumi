import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import type { Pool, PoolClient, QueryResultRow } from 'pg'
import type { UserStore } from './contracts'
import type { UserRecord, UserRole } from '../store'

type DatabaseClient = Pool | PoolClient

type UserRow = QueryResultRow & {
  id: string
  username: string
  display_name: string
  created_at: Date | string
  password_hash: string | null
  google_id: string | null
  email: string | null
  role: UserRole
}

function toUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    createdAt: new Date(row.created_at).getTime(),
    passwordHash: row.password_hash,
    googleId: row.google_id,
    email: row.email,
    role: row.role,
  }
}

function newUser(username: string, role: UserRole, extras: Partial<UserRecord> = {}): UserRecord {
  return {
    id: randomUUID(),
    username,
    displayName: username,
    createdAt: Date.now(),
    passwordHash: null,
    googleId: null,
    email: null,
    role,
    ...extras,
  }
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown })?.code === '23505'
}

export class PostgresUserStore implements UserStore {
  constructor(private readonly db: DatabaseClient) {}

  async findByUsername(username: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>('SELECT * FROM users WHERE username = $1', [username])
    return result.rows[0] ? toUser(result.rows[0]) : null
  }

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>('SELECT * FROM users WHERE google_id = $1', [googleId])
    return result.rows[0] ? toUser(result.rows[0]) : null
  }

  async save(user: UserRecord): Promise<void> {
    await this.db.query(
      `INSERT INTO users (id, username, display_name, created_at, password_hash, google_id, email, role)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7, $8)
       ON CONFLICT (username) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         created_at = EXCLUDED.created_at,
         password_hash = EXCLUDED.password_hash,
         google_id = EXCLUDED.google_id,
         email = EXCLUDED.email,
         role = EXCLUDED.role`,
      [user.id, user.username, user.displayName, user.createdAt, user.passwordHash, user.googleId, user.email, user.role],
    )
  }

  async createWithPassword(username: string, password: string, role: UserRole): Promise<UserRecord> {
    const user = newUser(username, role, { passwordHash: await bcrypt.hash(password, 12) })
    await this.insert(user)
    return user
  }

  async createWithGoogle(googleId: string, email: string, role: UserRole): Promise<UserRecord> {
    const existing = await this.findByGoogleId(googleId)
    if (existing) return existing

    const local = email.split('@')[0] ?? 'user'
    const base = local.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24) || 'user'

    for (let suffix = 0; ; suffix += 1) {
      const username = suffix === 0 ? base : `${base}${suffix}`
      const user = newUser(username, role, { googleId, email, displayName: base })
      try {
        await this.insert(user)
        return user
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
        const concurrent = await this.findByGoogleId(googleId)
        if (concurrent) return concurrent
      }
    }
  }

  async ensureSeed(username: string, password: string, role: UserRole): Promise<UserRecord> {
    const existing = await this.findByUsername(username)
    if (existing) return existing

    const user = newUser(username, role, { passwordHash: await bcrypt.hash(password, 12) })
    const result = await this.db.query<UserRow>(
      `INSERT INTO users (id, username, display_name, created_at, password_hash, google_id, email, role)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7, $8)
       ON CONFLICT (username) DO NOTHING
       RETURNING *`,
      [user.id, user.username, user.displayName, user.createdAt, user.passwordHash, user.googleId, user.email, user.role],
    )
    if (result.rows[0]) return toUser(result.rows[0])

    const concurrent = await this.findByUsername(username)
    if (!concurrent) throw new Error('seed_user_not_found')
    return concurrent
  }

  private async insert(user: UserRecord) {
    await this.db.query(
      `INSERT INTO users (id, username, display_name, created_at, password_hash, google_id, email, role)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6, $7, $8)`,
      [user.id, user.username, user.displayName, user.createdAt, user.passwordHash, user.googleId, user.email, user.role],
    )
  }
}
