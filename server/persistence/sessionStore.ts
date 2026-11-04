import { Redis } from '@upstash/redis'
import type session from 'express-session'
import { FileSessionStore } from '../sessionStore.js'
import { RedisSessionStore, type RedisSessionClient } from './redisSessionStore.js'
import { resolveUpstashConfig, type UpstashEnvironment } from './upstash.js'

export type RuntimeSessionStore = session.Store & {
  revokeAllForUser(username: string, exceptSid?: string): Promise<void>
}

export function createRuntimeSessionStore(
  secret: string,
  defaultTtlMs: number,
  environment: UpstashEnvironment = process.env,
): RuntimeSessionStore {
  const config = resolveUpstashConfig(environment)
  if (!config) return new FileSessionStore(secret)

  const redis = new Redis(config) as unknown as RedisSessionClient
  return new RedisSessionStore(redis, secret, defaultTtlMs)
}
