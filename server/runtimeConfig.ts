type RuntimeEnvironment = Record<string, string | undefined>

export function isProductionRuntime(environment: RuntimeEnvironment) {
  return environment.NODE_ENV === 'production' || environment.VERCEL === '1'
}

export function validateRuntimeEnvironment(environment: RuntimeEnvironment) {
  if (!isProductionRuntime(environment)) return

  if (!environment.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required in production')
  }

  const redisUrl = environment.UPSTASH_REDIS_REST_URL?.trim()
  const redisToken = environment.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!redisUrl || !redisToken) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production')
  }

  const sessionSecret = environment.SESSION_SECRET?.trim()
  if (!sessionSecret || sessionSecret === 'dev-only-change-me') {
    throw new Error('SESSION_SECRET is required in production')
  }
}
