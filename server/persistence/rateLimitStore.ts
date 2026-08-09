import { createHmac, randomUUID } from 'node:crypto'
import { Redis } from '@upstash/redis'
import type { RateLimitStore } from './contracts.js'

type RateLimitEnvironment = {
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
}

export interface RedisRateLimitClient {
  get<T>(key: string): Promise<T | null>
  del(...keys: string[]): Promise<number>
  eval<T>(script: string, keys: string[], args: Array<string | number>): Promise<T>
}

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
if redis.call('ZCARD', key) >= limit then
  redis.call('PEXPIRE', key, window)
  return 0
end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, window)
return 1
`

const LOGIN_FAILURE_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count >= tonumber(ARGV[1]) then
  redis.call('SET', KEYS[1], 'blocked', 'PX', ARGV[2])
end
return count
`

export class LocalRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, number[]>()
  private readonly loginAttempts = new Map<string, { count: number; until: number }>()

  constructor(private readonly now: () => number = Date.now) {}

  async consume(key: string, limit: number, windowMs: number) {
    const now = this.now()
    const recent = (this.windows.get(key) ?? []).filter((time) => time > now - windowMs)
    if (recent.length >= limit) return false
    recent.push(now)
    this.windows.set(key, recent)
    return true
  }

  async reset(key: string) {
    this.windows.delete(key)
  }

  async isLoginBlocked(key: string) {
    const entry = this.loginAttempts.get(key)
    if (entry && entry.until > this.now()) return true
    if (entry && entry.until > 0 && entry.until <= this.now()) this.loginAttempts.delete(key)
    return false
  }

  async registerLoginFailure(key: string, limit: number, blockMs: number) {
    const entry = this.loginAttempts.get(key) ?? { count: 0, until: 0 }
    entry.count += 1
    if (entry.count >= limit) {
      entry.until = this.now() + blockMs
      entry.count = 0
    }
    this.loginAttempts.set(key, entry)
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private readonly redis: RedisRateLimitClient,
    private readonly secret: string,
    private readonly now: () => number = Date.now,
    private readonly nonce: () => string = randomUUID,
  ) {}

  async consume(key: string, limit: number, windowMs: number) {
    return (await this.redis.eval<number>(
      SLIDING_WINDOW_SCRIPT,
      [this.storageKey('window', key)],
      [this.now(), windowMs, limit, this.nonce()],
    )) === 1
  }

  async reset(key: string) {
    await this.redis.del(this.storageKey('window', key))
  }

  async isLoginBlocked(key: string) {
    return (await this.redis.get<string>(this.storageKey('login', key))) === 'blocked'
  }

  async registerLoginFailure(key: string, limit: number, blockMs: number) {
    await this.redis.eval<number>(LOGIN_FAILURE_SCRIPT, [this.storageKey('login', key)], [limit, blockMs])
  }

  private storageKey(namespace: string, key: string) {
    const digest = createHmac('sha256', this.secret).update(key).digest('hex')
    return `togurumi:rate-limit:${namespace}:${digest}`
  }
}

export function createRuntimeRateLimitStore(
  secret: string,
  environment: RateLimitEnvironment = process.env,
): RateLimitStore {
  const url = environment.UPSTASH_REDIS_REST_URL?.trim()
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url && !token) return new LocalRateLimitStore()
  if (!url || !token) throw new Error('Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')

  const redis = new Redis({ url, token }) as unknown as RedisRateLimitClient
  return new RedisRateLimitStore(redis, secret)
}
