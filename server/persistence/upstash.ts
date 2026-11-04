export type UpstashEnvironment = {
  TOGURUMI_REDIS_KV_REST_API_URL?: string
  TOGURUMI_REDIS_KV_REST_API_TOKEN?: string
  UPSTASH_REDIS_REST_URL?: string
  UPSTASH_REDIS_REST_TOKEN?: string
}

export type UpstashConfig = {
  url: string
  token: string
}

/**
 * The Vercel Upstash integration prefixes its variables with the store name.
 * Prefer that pair; keep the legacy Upstash names for existing deployments.
 */
export function resolveUpstashConfig(
  environment: UpstashEnvironment = process.env,
): UpstashConfig | null {
  const integrationUrl = environment.TOGURUMI_REDIS_KV_REST_API_URL?.trim()
  const integrationToken = environment.TOGURUMI_REDIS_KV_REST_API_TOKEN?.trim()
  if (integrationUrl || integrationToken) {
    if (!integrationUrl || !integrationToken) {
      throw new Error('Set both TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN')
    }
    return { url: integrationUrl, token: integrationToken }
  }

  const url = environment.UPSTASH_REDIS_REST_URL?.trim()
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (url || token) {
    if (!url || !token) throw new Error('Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
    return { url, token }
  }

  return null
}
