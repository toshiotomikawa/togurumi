import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { JWT } from 'google-auth-library'

const ROWS = { values: [['MODELO', 'CUSTO'], ['Abelha', 'R$ 10,00']] }
const USER_AGENT = 'sheets-route-test'
const originalCwd = process.cwd()

let tempDir: string
let server: http.Server
let baseUrl: string
let staffCookie: string
let localUserStore: typeof import('./persistence/localAdapters.js').localUserStore

function read(cookie?: string) {
  return fetch(`${baseUrl}/api/sheets/CATALOGO`, {
    headers: { 'user-agent': USER_AGENT, ...(cookie ? { cookie } : {}) },
  })
}

before(async () => {
  // The local stores resolve `data/` from the cwd when imported, and setting
  // these to '' keeps dotenv from loading a real .env value over them.
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'togurumi-sheets-route-'))
  process.chdir(tempDir)
  for (const name of [
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'TOGURUMI_REDIS_KV_REST_API_URL',
    'TOGURUMI_REDIS_KV_REST_API_TOKEN',
    'VERCEL',
  ]) {
    process.env[name] = ''
  }
  process.env.NODE_ENV = 'test'
  for (const name of [
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY',
  ]) {
    process.env[name] = 'test-placeholder'
  }

  const { default: app } = await import('./index.js')
  const { createUser } = await import('./store.js')
  ;({ localUserStore } = await import('./persistence/localAdapters.js'))

  server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  await createUser('equipe', 'senha-de-teste', 'moderator')
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:5174',
      'user-agent': USER_AGENT,
    },
    body: JSON.stringify({ username: 'equipe', password: 'senha-de-teste' }),
  })
  assert.equal(login.status, 200)
  staffCookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  assert.ok(staffCookie)
})

after(async () => {
  server?.closeAllConnections()
  await new Promise((resolve) => server?.close(resolve))
  process.chdir(originalCwd)
  fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
})

test('anonymous visitors cannot read a sheet tab', async (t) => {
  const { resetAuthClientForTest } = await import('./sheets.js')
  const request = t.mock.method(JWT.prototype, 'request', async () => ({ data: ROWS }))
  resetAuthClientForTest()

  const response = await read()

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'unauthorized' })
  assert.equal(request.mock.callCount(), 0)
})

test('a signed-in staff member still reads the tab', async (t) => {
  const { resetAuthClientForTest } = await import('./sheets.js')
  t.mock.method(JWT.prototype, 'request', async () => ({ data: ROWS }))
  resetAuthClientForTest()

  const response = await read(staffCookie)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { rows: [{ MODELO: 'Abelha', CUSTO: 'R$ 10,00' }] })
})

test('a session whose account is not staff is refused', async (t) => {
  const { resetAuthClientForTest } = await import('./sheets.js')
  const request = t.mock.method(JWT.prototype, 'request', async () => ({ data: ROWS }))
  t.mock.method(localUserStore, 'findByUsername', async () => null)
  resetAuthClientForTest()

  const response = await read(staffCookie)

  assert.equal(response.status, 403)
  assert.equal(request.mock.callCount(), 0)
})
