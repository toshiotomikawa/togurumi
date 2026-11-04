import { resolveUpstashConfig } from './persistence/upstash.js'

type RuntimeEnvironment = Record<string, string | undefined>

export function isProductionRuntime(environment: RuntimeEnvironment) {
  return environment.NODE_ENV === 'production' || environment.VERCEL === '1'
}

export function validateRuntimeEnvironment(environment: RuntimeEnvironment) {
  if (!isProductionRuntime(environment)) return

  if (!environment.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required in production')
  }

  if (!resolveUpstashConfig(environment)) {
    throw new Error(
      'TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN (or the legacy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) are required in production',
    )
  }

  const sessionSecret = environment.SESSION_SECRET?.trim()
  if (!sessionSecret || sessionSecret === 'dev-only-change-me') {
    throw new Error('SESSION_SECRET is required in production')
  }
}
