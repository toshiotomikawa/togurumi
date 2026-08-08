import { createHmac } from 'node:crypto'
import session from 'express-session'

type StoredCookie = {
  originalMaxAge?: number | null
  maxAge?: number | null
  expires?: Date | string | null
  httpOnly?: boolean
  path?: string
  domain?: string
  secure?: boolean | 'auto'
  sameSite?: boolean | 'lax' | 'strict' | 'none'
}

type StoredSession = Omit<session.SessionData, 'cookie'> & {
  cookie?: StoredCookie
  userId?: string
}

export interface RedisSessionClient {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options: { px: number }): Promise<unknown>
  del(...keys: string[]): Promise<number>
  sadd(key: string, member: string, ...members: string[]): Promise<number>
  srem(key: string, ...members: string[]): Promise<number>
  smembers(key: string): Promise<string[]>
  pexpire(key: string, milliseconds: number): Promise<number>
}

function reviveSession(stored: StoredSession): session.SessionData {
  if (!stored.cookie) return stored as session.SessionData
  return {
    ...stored,
    cookie: {
      ...stored.cookie,
      expires: stored.cookie.expires ? new Date(stored.cookie.expires) : null,
    },
  } as session.SessionData
}

export class RedisSessionStore extends session.Store {
  constructor(
    private readonly redis: RedisSessionClient,
    private readonly secret: string,
    private readonly defaultTtlMs: number,
    private readonly now: () => number = Date.now,
  ) {
    super()
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void) {
    void this.read(sid).then((value) => callback(null, value)).catch((error) => callback(error))
  }

  set(sid: string, value: session.SessionData, callback?: (err?: unknown) => void) {
    void this.write(sid, value).then(() => callback?.()).catch((error) => callback?.(error))
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    void this.remove(sid).then(() => callback?.()).catch((error) => callback?.(error))
  }

  touch(sid: string, value: session.SessionData, callback?: (err?: unknown) => void) {
    this.set(sid, value, callback)
  }

  async revokeAllForUser(username: string, exceptSid?: string) {
    const indexKey = this.userIndexKey(username)
    const members = await this.redis.smembers(indexKey)
    const exceptKey = exceptSid ? this.sessionKey(exceptSid) : undefined
    const revoked = members.filter((key) => key !== exceptKey)

    if (revoked.length > 0) {
      await this.redis.del(...revoked)
      await this.redis.srem(indexKey, ...revoked)
    }
    if (!exceptKey || !members.includes(exceptKey)) await this.redis.del(indexKey)
  }

  private async read(sid: string): Promise<session.SessionData | null> {
    const stored = await this.redis.get<StoredSession>(this.sessionKey(sid))
    if (!stored) return null

    const expiresAt = stored.cookie?.expires ? new Date(stored.cookie.expires).getTime() : undefined
    if (expiresAt !== undefined && expiresAt <= this.now()) {
      await this.remove(sid, stored)
      return null
    }
    return reviveSession(stored)
  }

  private async write(sid: string, value: session.SessionData) {
    const ttlMs = this.ttl(value)
    if (ttlMs <= 0) {
      await this.remove(sid)
      return
    }

    const key = this.sessionKey(sid)
    const previous = await this.redis.get<StoredSession>(key)
    const stored = JSON.parse(JSON.stringify(value)) as StoredSession
    await this.redis.set(key, stored, { px: ttlMs })

    if (previous?.userId && previous.userId !== stored.userId) {
      await this.redis.srem(this.userIndexKey(previous.userId), key)
    }
    if (stored.userId) {
      const indexKey = this.userIndexKey(stored.userId)
      await this.redis.sadd(indexKey, key)
      await this.redis.pexpire(indexKey, Math.max(ttlMs, this.defaultTtlMs))
    }
  }

  private async remove(sid: string, known?: StoredSession) {
    const key = this.sessionKey(sid)
    const stored = known ?? await this.redis.get<StoredSession>(key)
    await this.redis.del(key)
    if (stored?.userId) await this.redis.srem(this.userIndexKey(stored.userId), key)
  }

  private ttl(value: session.SessionData) {
    const expires = value.cookie?.expires
    if (expires) return new Date(expires).getTime() - this.now()
    return value.cookie?.originalMaxAge ?? value.cookie?.maxAge ?? this.defaultTtlMs
  }

  private sessionKey(sid: string) {
    const digest = createHmac('sha256', this.secret).update(sid).digest('hex')
    return `togurumi:session:${digest}`
  }

  private userIndexKey(username: string) {
    const digest = createHmac('sha256', this.secret).update(username).digest('hex')
    return `togurumi:user-sessions:${digest}`
  }
}
