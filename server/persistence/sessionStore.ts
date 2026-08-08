import { Redis } from '@upstash/redis'
import type session from 'express-session'
import { FileSessionStore } from '../sessionStore'
import { RedisSessionStore, type RedisSessionClient } from './redisSessionStore'

type SessionEnvironment = {
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
}

export type RuntimeSessionStore = session.Store & {
  revokeAllForUser(username: string, exceptSid?: string): Promise<void>
}

export function createRuntimeSessionStore(
  secret: string,
  defaultTtlMs: number,
  environment: SessionEnvironment = process.env,
): RuntimeSessionStore {
  const url = environment.UPSTASH_REDIS_REST_URL?.trim()
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url && !token) return new FileSessionStore(secret)
  if (!url || !token) throw new Error('Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')

  const redis = new Redis({ url, token }) as unknown as RedisSessionClient
  return new RedisSessionStore(redis, secret, defaultTtlMs)
}
