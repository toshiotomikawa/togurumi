import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveUpstashConfig } from './upstash.js'

test('the Vercel integration pair wins over the legacy Upstash pair', () => {
  assert.deepEqual(resolveUpstashConfig({
    TOGURUMI_REDIS_KV_REST_API_URL: 'https://new.example',
    TOGURUMI_REDIS_KV_REST_API_TOKEN: 'new-token',
    UPSTASH_REDIS_REST_URL: 'https://old.example',
    UPSTASH_REDIS_REST_TOKEN: 'old-token',
  }), { url: 'https://new.example', token: 'new-token' })
})

test('the legacy pair is used when the integration pair is absent', () => {
  assert.deepEqual(resolveUpstashConfig({
    UPSTASH_REDIS_REST_URL: 'https://old.example',
    UPSTASH_REDIS_REST_TOKEN: 'old-token',
  }), { url: 'https://old.example', token: 'old-token' })
})

test('no configuration means the local stores', () => {
  assert.equal(resolveUpstashConfig({}), null)
  assert.equal(resolveUpstashConfig({
    TOGURUMI_REDIS_KV_REST_API_URL: '   ',
    UPSTASH_REDIS_REST_TOKEN: '   ',
  }), null)
})

test('a partial integration pair fails closed instead of using the legacy pair', () => {
  assert.throws(
    () => resolveUpstashConfig({
      TOGURUMI_REDIS_KV_REST_API_URL: 'https://new.example',
      UPSTASH_REDIS_REST_URL: 'https://old.example',
      UPSTASH_REDIS_REST_TOKEN: 'old-token',
    }),
    /Set both TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN/,
  )
  assert.throws(
    () => resolveUpstashConfig({
      TOGURUMI_REDIS_KV_REST_API_TOKEN: 'new-token',
      UPSTASH_REDIS_REST_URL: 'https://old.example',
      UPSTASH_REDIS_REST_TOKEN: 'old-token',
    }),
    /Set both TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN/,
  )
})

test('a partial legacy pair fails closed', () => {
  assert.throws(
    () => resolveUpstashConfig({ UPSTASH_REDIS_REST_URL: 'https://old.example' }),
    /Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  )
  assert.throws(
    () => resolveUpstashConfig({ UPSTASH_REDIS_REST_TOKEN: 'old-token' }),
    /Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  )
})

test('surrounding whitespace is trimmed from the selected pair', () => {
  assert.deepEqual(resolveUpstashConfig({
    TOGURUMI_REDIS_KV_REST_API_URL: '  https://new.example  ',
    TOGURUMI_REDIS_KV_REST_API_TOKEN: '  new-token  ',
  }), { url: 'https://new.example', token: 'new-token' })
})
