import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LocalRateLimitStore,
  RedisRateLimitStore,
  createRuntimeRateLimitStore,
  type RedisRateLimitClient,
} from './rateLimitStore.js'

type Backend = {
  strings: Map<string, { value: string; expiresAt?: number }>
  windows: Map<string, Array<{ score: number; member: string }>>
}

class FakeRedis implements RedisRateLimitClient {
  constructor(private readonly backend: Backend, private readonly now: () => number) {}

  async get<T>(key: string): Promise<T | null> {
    this.expire(key)
    return (this.backend.strings.get(key)?.value as T | undefined) ?? null
  }

  async del(...keys: string[]) {
    let deleted = 0
    for (const key of keys) {
      if (this.backend.strings.delete(key) || this.backend.windows.delete(key)) deleted += 1
    }
    return deleted
  }

  async eval<T>(script: string, keys: string[], args: Array<string | number>): Promise<T> {
    const key = keys[0]
    this.expire(key)
    if (script.includes('ZREMRANGEBYSCORE')) {
      const [now, windowMs, limit, member] = args as [number, number, number, string]
      const recent = (this.backend.windows.get(key) ?? []).filter((entry) => entry.score > now - windowMs)
      if (recent.length >= limit) {
        this.backend.windows.set(key, recent)
        return 0 as T
      }
      recent.push({ score: now, member })
      this.backend.windows.set(key, recent)
      return 1 as T
    }

    const [limit, blockMs] = args as [number, number]
    const current = Number(this.backend.strings.get(key)?.value ?? 0) + 1
    this.backend.strings.set(key, current >= limit
      ? { value: 'blocked', expiresAt: this.now() + blockMs }
      : { value: String(current) })
    return current as T
  }

  keys() {
    return [...this.backend.strings.keys(), ...this.backend.windows.keys()]
  }

  private expire(key: string) {
    const entry = this.backend.strings.get(key)
    if (entry?.expiresAt !== undefined && entry.expiresAt <= this.now()) this.backend.strings.delete(key)
  }
}

function backend(): Backend {
  return { strings: new Map(), windows: new Map() }
}

test('local fallback preserves limits, sliding expiration and login blocking', async () => {
  let now = 1_000
  const store = new LocalRateLimitStore(() => now)
  assert.equal(await store.consume('review:ip', 1, 60_000), true)
  assert.equal(await store.consume('review:ip', 1, 60_000), false)
  now += 60_001
  assert.equal(await store.consume('review:ip', 1, 60_000), true)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(await store.isLoginBlocked('login:ip:user'), false)
    await store.registerLoginFailure('login:ip:user', 5, 900_000)
  }
  assert.equal(await store.isLoginBlocked('login:ip:user'), true)
  now += 900_001
  assert.equal(await store.isLoginBlocked('login:ip:user'), false)
})

test('Redis sliding window is atomic under concurrency and expires', async () => {
  let now = 2_000
  const client = new FakeRedis(backend(), () => now)
  let nonce = 0
  const store = new RedisRateLimitStore(client, 'secret', () => now, () => String(++nonce))
  const results = await Promise.all(Array.from({ length: 30 }, () => store.consume('upload:user', 20, 900_000)))
  assert.equal(results.filter(Boolean).length, 20)
  now += 900_001
  assert.equal(await store.consume('upload:user', 20, 900_000), true)
})

test('Redis state is shared between instances and namespaces stay independent', async () => {
  const now = 3_000
  const shared = backend()
  let nonce = 0
  const first = new RedisRateLimitStore(new FakeRedis(shared, () => now), 'secret', () => now, () => `a-${++nonce}`)
  const second = new RedisRateLimitStore(new FakeRedis(shared, () => now), 'secret', () => now, () => `b-${++nonce}`)

  assert.equal(await first.consume('review:same', 1, 60_000), true)
  assert.equal(await second.consume('review:same', 1, 60_000), false)
  assert.equal(await second.consume('upload:same', 1, 60_000), true)
})

test('login failures are shared, atomic and expire after the block window', async () => {
  let now = 4_000
  const shared = backend()
  const first = new RedisRateLimitStore(new FakeRedis(shared, () => now), 'secret', () => now)
  const second = new RedisRateLimitStore(new FakeRedis(shared, () => now), 'secret', () => now)
  await Promise.all(Array.from({ length: 5 }, (_, index) =>
    (index % 2 === 0 ? first : second).registerLoginFailure('ip:user', 5, 900_000),
  ))
  assert.equal(await first.isLoginBlocked('ip:user'), true)
  now += 900_001
  assert.equal(await second.isLoginBlocked('ip:user'), false)
})

test('Redis keys hide personal identifiers and reset releases a consumed key', async () => {
  const client = new FakeRedis(backend(), () => 5_000)
  const store = new RedisRateLimitStore(client, 'secret', () => 5_000, () => 'nonce')
  await store.consume('review:203.0.113.4', 1, 60_000)
  assert.equal(client.keys().some((key) => key.includes('203.0.113.4')), false)
  await store.reset('review:203.0.113.4')
  assert.equal(await store.consume('review:203.0.113.4', 1, 60_000), true)
})

test('runtime selection uses local fallback and fails closed on partial Redis configuration', () => {
  assert.ok(createRuntimeRateLimitStore('secret', {}) instanceof LocalRateLimitStore)
  assert.throws(
    () => createRuntimeRateLimitStore('secret', { UPSTASH_REDIS_REST_URL: 'https://example.invalid' }),
    /Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  )
  assert.ok(createRuntimeRateLimitStore('secret', {
    UPSTASH_REDIS_REST_URL: 'https://example.invalid',
    UPSTASH_REDIS_REST_TOKEN: 'token',
  }) instanceof RedisRateLimitStore)
})
