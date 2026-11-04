import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { test } from 'node:test'
import { buildAllowedOrigins, originAllowed } from './authSession.js'
import app from './index.js'
import { validateRuntimeEnvironment } from './runtimeConfig.js'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://example',
  UPSTASH_REDIS_REST_URL: 'https://redis.example',
  UPSTASH_REDIS_REST_TOKEN: 'token',
  SESSION_SECRET: 'test-session-secret',
}

test('production and Vercel runtimes require durable stores and a session secret', () => {
  assert.throws(
    () => validateRuntimeEnvironment({ NODE_ENV: 'production' }),
    /DATABASE_URL is required/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({ ...productionEnvironment, DATABASE_URL: '' }),
    /DATABASE_URL is required/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({ ...productionEnvironment, UPSTASH_REDIS_REST_TOKEN: '' }),
    /Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example',
      SESSION_SECRET: 'test-session-secret',
    }),
    /TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({
      ...productionEnvironment,
      TOGURUMI_REDIS_KV_REST_API_URL: 'https://redis.example',
      TOGURUMI_REDIS_KV_REST_API_TOKEN: '',
    }),
    /Set both TOGURUMI_REDIS_KV_REST_API_URL and TOGURUMI_REDIS_KV_REST_API_TOKEN/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({ ...productionEnvironment, SESSION_SECRET: 'dev-only-change-me' }),
    /SESSION_SECRET is required/,
  )
  assert.throws(
    () => validateRuntimeEnvironment({ VERCEL: '1' }),
    /DATABASE_URL is required/,
  )
  assert.doesNotThrow(() => validateRuntimeEnvironment(productionEnvironment))
  assert.doesNotThrow(() => validateRuntimeEnvironment({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://example',
    SESSION_SECRET: 'test-session-secret',
    TOGURUMI_REDIS_KV_REST_API_URL: 'https://redis.example',
    TOGURUMI_REDIS_KV_REST_API_TOKEN: 'token',
  }))
})

test('local development keeps the existing configuration fallbacks', () => {
  assert.doesNotThrow(() => validateRuntimeEnvironment({ NODE_ENV: 'development' }))
  assert.doesNotThrow(() => validateRuntimeEnvironment({}))
})

test('Vercel deployments allow only their configured system origins', () => {
  const origins = buildAllowedOrigins('https://canonical.example', {
    VERCEL: '1',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'togurumi-git-feature.example.vercel.app',
    VERCEL_BRANCH_URL: 'togurumi-git-feature.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'togurumi.example',
  })

  const requestFrom = (origin: string) => ({ headers: { origin } }) as Parameters<typeof originAllowed>[0]
  assert.equal(originAllowed(requestFrom('https://togurumi-git-feature.example.vercel.app'), origins), true)
  assert.equal(originAllowed(requestFrom('https://togurumi-git-feature.vercel.app'), origins), true)
  assert.equal(originAllowed(requestFrom('https://canonical.example'), origins), true)
  assert.equal(originAllowed(requestFrom('https://togurumi.example'), origins), false)
  assert.equal(originAllowed(requestFrom('https://external.example'), origins), false)

  const productionOrigins = buildAllowedOrigins('https://canonical.example', {
    VERCEL: '1',
    VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'togurumi.example',
  })
  assert.equal(originAllowed(requestFrom('https://togurumi.example'), productionOrigins), true)

  const localOrigins = buildAllowedOrigins('http://localhost:5174', {})
  assert.equal(originAllowed(requestFrom('http://localhost:5174'), localOrigins), true)
})

test('importing the Express app does not start a listener', () => {
  const tsxCli = path.resolve('node_modules', 'tsx', 'dist', 'cli.mjs')
  const result = spawnSync(
    process.execPath,
    [tsxCli, '--eval', "import('./server/index.ts').then(() => console.log('imported'))"],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 5_000,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VERCEL: '',
        DATABASE_URL: '',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        TOGURUMI_REDIS_KV_REST_API_URL: '',
        TOGURUMI_REDIS_KV_REST_API_TOKEN: '',
      },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /imported/)
})

test('the exported app serves the existing API routes', async () => {
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  try {
    const address = server.address()
    assert(address && typeof address === 'object')
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/config`)
    assert.equal(response.status, 200)
    assert.deepEqual(Object.keys(await response.json()), ['google'])
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  }
})

test('Vercel routes API requests before the SPA fallback', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'))
  assert.equal(config.installCommand, 'npm ci')
  assert.equal(config.devCommand, 'npm run dev:web')
  assert.deepEqual(config.rewrites, [
    { source: '/api/:path*', destination: '/api' },
    { source: '/', destination: '/index.html' },
    { source: '/:path((?!api/|assets/|.*\\.).*)', destination: '/index.html' },
  ])
})
