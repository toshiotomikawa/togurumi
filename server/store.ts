import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcrypt'

export type UserRole = 'admin' | 'moderator'

export type UserRecord = {
  id: string
  username: string
  displayName: string
  createdAt: number
  passwordHash: string | null
  googleId: string | null
  email: string | null
  role: UserRole
}

type UserDatabase = {
  users: UserRecord[]
}

const dataDir = path.resolve('data')
const usersPath = path.join(dataDir, 'users.json')

function normalizeUser(user: Partial<UserRecord> & Pick<UserRecord, 'username' | 'role'>): UserRecord {
  return {
    id: user.id ?? randomUUID(),
    username: user.username,
    displayName: user.displayName ?? user.username,
    createdAt: user.createdAt ?? Date.now(),
    passwordHash: user.passwordHash ?? null,
    googleId: user.googleId ?? null,
    email: user.email ?? null,
    role: user.role,
  }
}

async function loadDb(): Promise<UserDatabase> {
  try {
    const raw = await readFile(usersPath, 'utf8')
    const db = JSON.parse(raw) as { users: Partial<UserRecord>[] }
    const users = db.users.map((user) =>
      normalizeUser({
        ...user,
        username: user.username ?? 'user',
        role: user.role === 'admin' ? 'admin' : 'moderator',
      }),
    )
    return { users }
  } catch {
    return { users: [] }
  }
}

async function writeDb(db: UserDatabase) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(usersPath, JSON.stringify(db, null, 2), 'utf8')
}

export async function findUser(username: string): Promise<UserRecord | null> {
  const db = await loadDb()
  return db.users.find((user) => user.username === username) ?? null
}

export async function findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  const db = await loadDb()
  return db.users.find((user) => user.googleId === googleId) ?? null
}

export async function saveUser(user: UserRecord) {
  const db = await loadDb()
  const index = db.users.findIndex((entry) => entry.username === user.username)
  if (index === -1) db.users.push(normalizeUser(user))
  else db.users[index] = normalizeUser(user)
  await writeDb(db)
}

function uniqueUsername(base: string, taken: Set<string>) {
  let candidate = base
  let n = 1
  while (taken.has(candidate)) {
    candidate = `${base}${n}`
    n += 1
  }
  return candidate
}

function newUserBase(username: string, role: UserRole, extras: Partial<UserRecord> = {}): UserRecord {
  const now = Date.now()
  return normalizeUser({
    id: randomUUID(),
    username,
    displayName: username,
    createdAt: now,
    passwordHash: null,
    googleId: null,
    email: null,
    role,
    ...extras,
  })
}

export async function createUser(username: string, password: string, role: UserRole) {
  const passwordHash = await bcrypt.hash(password, 12)
  const user = newUserBase(username, role, { passwordHash })
  await saveUser(user)
  return user
}

export async function createGoogleUser(googleId: string, email: string, role: UserRole) {
  const db = await loadDb()
  const taken = new Set(db.users.map((user) => user.username))
  const local = email.split('@')[0] ?? 'user'
  const base = local.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24) || 'user'
  const username = uniqueUsername(base, taken)

  const user = newUserBase(username, role, { googleId, email, displayName: base })
  await saveUser(user)
  return user
}

export async function ensureSeedUser(username: string, password: string, role: UserRole): Promise<UserRecord> {
  const existing = await findUser(username)
  if (existing) return existing

  return createUser(username, password, role)
}
