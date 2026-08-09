import assert from 'node:assert/strict'
import test from 'node:test'
import session from 'express-session'
import { FileSessionStore } from '../sessionStore.js'
import { RedisSessionStore, type RedisSessionClient } from './redisSessionStore.js'
import { createRuntimeSessionStore } from './sessionStore.js'

type Entry = { value: unknown; expiresAt?: number }
type Backend = { values: Map<string, Entry>; sets: Map<string, Set<string>>; expires: Map<string, number> }

class FakeRedis implements RedisSessionClient {
  constructor(private readonly backend: Backend, private readonly now: () => number) {}

  async get<T>(key: string): Promise<T | null> {
    this.expire(key)
    const entry = this.backend.values.get(key)
    return entry ? JSON.parse(JSON.stringify(entry.value)) as T : null
  }

  async set<T>(key: string, value: T, options: { px: number }) {
    this.backend.values.set(key, { value: JSON.parse(JSON.stringify(value)), expiresAt: this.now() + options.px })
    return 'OK'
  }

  async del(...keys: string[]) {
    let deleted = 0
    for (const key of keys) {
      if (this.backend.values.delete(key) || this.backend.sets.delete(key)) deleted += 1
      this.backend.expires.delete(key)
    }
    return deleted
  }

  async sadd(key: string, member: string, ...members: string[]) {
    this.expire(key)
    const set = this.backend.sets.get(key) ?? new Set<string>()
    const before = set.size
    for (const value of [member, ...members]) set.add(value)
    this.backend.sets.set(key, set)
    return set.size - before
  }

  async srem(key: string, ...members: string[]) {
    this.expire(key)
    const set = this.backend.sets.get(key)
    if (!set) return 0
    let removed = 0
    for (const member of members) if (set.delete(member)) removed += 1
    if (set.size === 0) {
      this.backend.sets.delete(key)
      this.backend.expires.delete(key)
    }
    return removed
  }

  async smembers(key: string) {
    this.expire(key)
    return [...(this.backend.sets.get(key) ?? [])]
  }

  async pexpire(key: string, milliseconds: number) {
    if (!this.backend.values.has(key) && !this.backend.sets.has(key)) return 0
    this.backend.expires.set(key, this.now() + milliseconds)
    return 1
  }

  rawValues() {
    return this.backend.values
  }

  private expire(key: string) {
    const valueExpiry = this.backend.values.get(key)?.expiresAt
    const setExpiry = this.backend.expires.get(key)
    if ((valueExpiry !== undefined && valueExpiry <= this.now()) || (setExpiry !== undefined && setExpiry <= this.now())) {
      this.backend.values.delete(key)
      this.backend.sets.delete(key)
      this.backend.expires.delete(key)
    }
  }
}

function backend(): Backend {
  return { values: new Map(), sets: new Map(), expires: new Map() }
}

function value(clock: number, ttl: number, userId = 'bella') {
  return {
    cookie: {
      originalMaxAge: ttl,
      expires: new Date(clock + ttl),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    },
    userId,
    clientFp: 'fingerprint',
    oauthState: 'oauth-state',
  } as unknown as session.SessionData
}

function set(store: session.Store, sid: string, data: session.SessionData) {
  return new Promise<void>((resolve, reject) => store.set(sid, data, (error) => error ? reject(error) : resolve()))
}

function get(store: session.Store, sid: string) {
  return new Promise<session.SessionData | null>((resolve, reject) =>
    store.get(sid, (error, data) => error ? reject(error) : resolve(data ?? null)),
  )
}

function touch(store: session.Store, sid: string, data: session.SessionData) {
  return new Promise<void>((resolve, reject) => store.touch(sid, data, (error) => error ? reject(error) : resolve()))
}

function destroy(store: session.Store, sid: string) {
  return new Promise<void>((resolve, reject) => store.destroy(sid, (error) => error ? reject(error) : resolve()))
}

test('set/get/touch/destroy preserve session fields and rolling TTL', async () => {
  let now = 1_000_000
  const redis = new FakeRedis(backend(), () => now)
  const store = new RedisSessionStore(redis, 'session-secret', 30_000, () => now)

  await set(store, 'sid-1', value(now, 1_000))
  const loaded = await get(store, 'sid-1')
  assert.equal((loaded as session.SessionData & { userId?: string }).userId, 'bella')
  assert.equal((loaded as session.SessionData & { clientFp?: string }).clientFp, 'fingerprint')
  assert.equal((loaded as session.SessionData & { oauthState?: string }).oauthState, 'oauth-state')
  assert.ok(loaded?.cookie.expires instanceof Date)

  await touch(store, 'sid-1', value(now, 3_000))
  now += 1_500
  assert.ok(await get(store, 'sid-1'))
  await destroy(store, 'sid-1')
  assert.equal(await get(store, 'sid-1'), null)
})

test('expired sessions disappear and Redis receives no raw SID or extra sensitive data', async () => {
  let now = 2_000_000
  const redis = new FakeRedis(backend(), () => now)
  const store = new RedisSessionStore(redis, 'top-secret', 30_000, () => now)
  await set(store, 'raw-session-id', value(now, 500))

  const serialized = JSON.stringify([...redis.rawValues()])
  assert.equal(serialized.includes('raw-session-id'), false)
  assert.equal(serialized.includes('top-secret'), false)
  assert.equal(serialized.includes('password'), false)

  now += 501
  assert.equal(await get(store, 'raw-session-id'), null)
})

test('revokeAllForUser revokes every session except the optional current SID', async () => {
  const now = 3_000_000
  const redis = new FakeRedis(backend(), () => now)
  const store = new RedisSessionStore(redis, 'secret', 30_000, () => now)
  await set(store, 'one', value(now, 10_000, 'bella'))
  await set(store, 'two', value(now, 10_000, 'bella'))
  await set(store, 'other', value(now, 10_000, 'moderator'))

  await store.revokeAllForUser('bella', 'two')
  assert.equal(await get(store, 'one'), null)
  assert.ok(await get(store, 'two'))
  assert.ok(await get(store, 'other'))

  await store.revokeAllForUser('bella')
  assert.equal(await get(store, 'two'), null)
  assert.ok(await get(store, 'other'))
})

test('separate store instances share sessions through the same Redis backend', async () => {
  const now = 4_000_000
  const shared = backend()
  const first = new RedisSessionStore(new FakeRedis(shared, () => now), 'same-secret', 30_000, () => now)
  const second = new RedisSessionStore(new FakeRedis(shared, () => now), 'same-secret', 30_000, () => now)

  await set(first, 'shared-sid', value(now, 10_000))
  assert.equal((await get(second, 'shared-sid') as session.SessionData & { userId?: string }).userId, 'bella')
  await destroy(second, 'shared-sid')
  assert.equal(await get(first, 'shared-sid'), null)
})

test('runtime selection falls back locally and rejects partial Redis configuration', () => {
  assert.ok(createRuntimeSessionStore('secret', 30_000, {}) instanceof FileSessionStore)
  assert.throws(
    () => createRuntimeSessionStore('secret', 30_000, { UPSTASH_REDIS_REST_URL: 'https://example.invalid' }),
    /Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  )
  assert.ok(createRuntimeSessionStore('secret', 30_000, {
    UPSTASH_REDIS_REST_URL: 'https://example.invalid',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
  }) instanceof RedisSessionStore)
})
