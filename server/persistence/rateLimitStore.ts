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
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
if count >= tonumber(ARGV[1]) then
  redis.call('SET', KEYS[1], 'blocked', 'PX', ARGV[2])
end
return count
`

export class LocalRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, number[]>()
  private readonly loginAttempts = new Map<string, { count: number; until: number; expiresAt: number }>()

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
    const now = this.now()
    const existing = this.loginAttempts.get(key)
    const entry = existing && existing.expiresAt > now
      ? existing
      : { count: 0, until: 0, expiresAt: now + blockMs }
    entry.count += 1
    if (entry.count >= limit) {
      entry.until = now + blockMs
    }
    this.loginAttempts.set(key, entry)
  }
}

/** Upstash calls must answer fast; past this the local fallback takes over. */
export const RATE_LIMIT_FALLBACK_TIMEOUT_MS = 1_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`rate limit backend timed out after ${timeoutMs}ms`)),
      timeoutMs,
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

function describeError(err: unknown) {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err)
}

/**
 * Keeps the site usable when Upstash is unreachable: every call tries Redis
 * first, then answers from an in-process store instead of failing the route.
 * Limits become per-instance until Redis recovers.
 */
export class FallbackRateLimitStore implements RateLimitStore {
  private warned = false

  constructor(
    private readonly primary: RateLimitStore,
    private readonly fallback: RateLimitStore = new LocalRateLimitStore(),
    private readonly timeoutMs: number = RATE_LIMIT_FALLBACK_TIMEOUT_MS,
    private readonly logger: Pick<Console, 'warn'> = console,
  ) {}

  consume(key: string, limit: number, windowMs: number) {
    return this.run((store) => store.consume(key, limit, windowMs))
  }

  reset(key: string) {
    return this.run((store) => store.reset(key))
  }

  isLoginBlocked(key: string) {
    return this.run((store) => store.isLoginBlocked(key))
  }

  registerLoginFailure(key: string, limit: number, blockMs: number) {
    return this.run((store) => store.registerLoginFailure(key, limit, blockMs))
  }

  private async run<T>(operation: (store: RateLimitStore) => Promise<T>): Promise<T> {
    try {
      const result = await withTimeout(operation(this.primary), this.timeoutMs)
      this.warned = false
      return result
    } catch (err) {
      if (!this.warned) {
        this.warned = true
        this.logger.warn(`[rate-limit] Upstash unavailable, using local fallback: ${describeError(err)}`)
      }
      return operation(this.fallback)
    }
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

  const redis = new Redis({
    url,
    token,
    retry: false,
    signal: () => AbortSignal.timeout(RATE_LIMIT_FALLBACK_TIMEOUT_MS),
  }) as unknown as RedisRateLimitClient
  return new FallbackRateLimitStore(new RedisRateLimitStore(redis, secret), new LocalRateLimitStore())
}
