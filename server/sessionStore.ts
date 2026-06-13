import { createHmac } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import session from 'express-session'

type StoredCookie = {
  originalMaxAge?: number | null
  maxAge?: number | null
  expires?: string | null
  httpOnly?: boolean
  path?: string
  domain?: string
  secure?: boolean | 'auto'
  sameSite?: boolean | 'lax' | 'strict' | 'none'
}

type StoredSession = session.SessionData & {
  cookie?: StoredCookie
}

type SessionDatabaseV1 = {
  v: 1
  sessions: Record<string, StoredSession>
  byUser: Record<string, string[]>
}

const sessionsPath = path.join(path.resolve('data'), 'sessions.json')

function sessionExpired(entry: StoredSession): boolean {
  const expires = entry.cookie?.expires
  if (!expires) return false
  return new Date(expires).getTime() <= Date.now()
}

function reviveSession(entry: StoredSession): session.SessionData {
  if (!entry.cookie?.expires || typeof entry.cookie.expires !== 'string') {
    return entry
  }

  return {
    ...entry,
    cookie: {
      ...entry.cookie,
      expires: new Date(entry.cookie.expires),
    },
  } as session.SessionData
}

function isLegacyDatabase(value: unknown): value is Record<string, StoredSession> {
  if (!value || typeof value !== 'object') return false
  if ('v' in value) return false
  return true
}

function emptyDb(): SessionDatabaseV1 {
  return { v: 1, sessions: {}, byUser: {} }
}

export class FileSessionStore extends session.Store {
  private db: SessionDatabaseV1 = emptyDb()
  private ready: Promise<void>
  private writeQueue: Promise<void> = Promise.resolve()
  private readonly secret: string

  constructor(secret: string) {
    super()
    this.secret = secret
    this.ready = this.hydrate()
  }

  private storageKey(sid: string) {
    return createHmac('sha256', this.secret).update(sid).digest('hex')
  }

  private trackUser(storageKey: string, userId?: string) {
    for (const [username, keys] of Object.entries(this.db.byUser)) {
      const next = keys.filter((key) => key !== storageKey)
      if (next.length === 0) delete this.db.byUser[username]
      else this.db.byUser[username] = next
    }

    if (!userId) return

    const keys = this.db.byUser[userId] ?? []
    if (!keys.includes(storageKey)) {
      this.db.byUser[userId] = [...keys, storageKey]
    }
  }

  private async hydrate() {
    await mkdir(path.dirname(sessionsPath), { recursive: true })
    try {
      const raw = await readFile(sessionsPath, 'utf8')
      const parsed = JSON.parse(raw) as SessionDatabaseV1 | Record<string, StoredSession>
      let dirty = false

      if (isLegacyDatabase(parsed)) {
        this.db = emptyDb()
        for (const [sid, entry] of Object.entries(parsed)) {
          if (sessionExpired(entry)) {
            dirty = true
            continue
          }
          const key = this.storageKey(sid)
          this.db.sessions[key] = entry
          this.trackUser(key, entry.userId)
        }
        dirty = true
      } else if (parsed.v === 1) {
        this.db = { v: 1, sessions: {}, byUser: {} }
        for (const [key, entry] of Object.entries(parsed.sessions ?? {})) {
          if (sessionExpired(entry)) {
            dirty = true
            continue
          }
          this.db.sessions[key] = entry
          this.trackUser(key, entry.userId)
        }
      }

      if (dirty) await this.persist()
    } catch {
      this.db = emptyDb()
    }
  }

  private persist() {
    this.writeQueue = this.writeQueue
      .then(() => writeFile(sessionsPath, JSON.stringify(this.db, null, 2), 'utf8'))
      .catch(() => undefined)
    return this.writeQueue
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void) {
    void this.ready
      .then(() => {
        const entry = this.db.sessions[this.storageKey(sid)]
        if (!entry) {
          callback(null, null)
          return
        }
        if (sessionExpired(entry)) {
          this.destroy(sid, () => callback(null, null))
          return
        }
        callback(null, reviveSession(entry))
      })
      .catch((err) => callback(err))
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    void this.ready
      .then(() => {
        const key = this.storageKey(sid)
        const stored = JSON.parse(JSON.stringify(sess)) as StoredSession
        this.db.sessions[key] = stored
        this.trackUser(key, stored.userId)
        return this.persist()
      })
      .then(() => callback?.())
      .catch((err) => callback?.(err))
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    void this.ready
      .then(() => {
        const key = this.storageKey(sid)
        delete this.db.sessions[key]
        for (const [username, keys] of Object.entries(this.db.byUser)) {
          const next = keys.filter((entry) => entry !== key)
          if (next.length === 0) delete this.db.byUser[username]
          else this.db.byUser[username] = next
        }
        return this.persist()
      })
      .then(() => callback?.())
      .catch((err) => callback?.(err))
  }

  touch(sid: string, sess: session.SessionData, callback?: () => void) {
    this.set(sid, sess, callback)
  }

  async revokeAllForUser(username: string, exceptSid?: string) {
    await this.ready
    const exceptKey = exceptSid ? this.storageKey(exceptSid) : undefined
    const keys = [...(this.db.byUser[username] ?? [])]

    for (const key of keys) {
      if (exceptKey && key === exceptKey) continue
      delete this.db.sessions[key]
    }

    this.db.byUser[username] = exceptKey && keys.includes(exceptKey) ? [exceptKey] : []
    if (this.db.byUser[username].length === 0) delete this.db.byUser[username]

    await this.persist()
  }
}
