import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sheetsEnabled } from './sheets.js'

test('sheetsEnabled detects service account configuration', () => {
  const origSheet = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const origEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
  const origKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY
  const origOAuth = process.env.GOOGLE_SHEETS_REFRESH_TOKEN
  const origClientId = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID
  const origClientSecret = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET

  try {
    delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY
    delete process.env.GOOGLE_SHEETS_REFRESH_TOKEN
    delete process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID
    delete process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET
    assert.equal(sheetsEnabled(), false)

    // With spreadsheet ID and Service Account
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'sheet-123'
    process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = 'service@example.iam.gserviceaccount.com'
    process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY = 'fake-pem-key'
    assert.equal(sheetsEnabled(), true)

    // Clear service account, test OAuth
    delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY
    assert.equal(sheetsEnabled(), false)

    process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID = 'client-id'
    process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET = 'client-secret'
    process.env.GOOGLE_SHEETS_REFRESH_TOKEN = 'refresh-token'
    assert.equal(sheetsEnabled(), true)
  } finally {
    if (origSheet !== undefined) process.env.GOOGLE_SHEETS_SPREADSHEET_ID = origSheet
    else delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    if (origEmail !== undefined) process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL = origEmail
    else delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    if (origKey !== undefined) process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY = origKey
    else delete process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY
    if (origOAuth !== undefined) process.env.GOOGLE_SHEETS_REFRESH_TOKEN = origOAuth
    else delete process.env.GOOGLE_SHEETS_REFRESH_TOKEN
    if (origClientId !== undefined) process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID = origClientId
    else delete process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID
    if (origClientSecret !== undefined) process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET = origClientSecret
    else delete process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET
  }
})
