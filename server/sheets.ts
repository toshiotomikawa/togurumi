import { OAuth2Client } from 'google-auth-library'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? ''
const OAUTH_CLIENT_ID = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET ?? ''
const REFRESH_TOKEN = process.env.GOOGLE_SHEETS_REFRESH_TOKEN ?? ''
const CACHE_TTL_MS = Number(process.env.GOOGLE_SHEETS_CACHE_TTL_MS ?? 60_000)

const TAB_NAME_PATTERN = /^[\w \-]+$/
const A1_RANGE_PATTERN = /^[A-Z]+\d+(:[A-Z]+\d*)?$/

let authClient: OAuth2Client | null = null
const cache = new Map<string, { expiresAt: number; rows: Record<string, string>[] }>()

export function sheetsEnabled() {
  return Boolean(SPREADSHEET_ID && OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && REFRESH_TOKEN)
}

function getAuthClient() {
  if (!authClient) {
    authClient = new OAuth2Client(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET)
    authClient.setCredentials({ refresh_token: REFRESH_TOKEN })
  }
  return authClient
}

function rowsToObjects(values: string[][]): Record<string, string>[] {
  const [headers = [], ...rows] = values
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  )
}

export class SheetsError extends Error {
  constructor(public code: 'disabled' | 'invalid_tab' | 'fetch_failed') {
    super(code)
  }
}

export async function getSheetTab(tab: string): Promise<Record<string, string>[]> {
  if (!sheetsEnabled()) throw new SheetsError('disabled')
  if (!TAB_NAME_PATTERN.test(tab)) throw new SheetsError('invalid_tab')

  const cached = cache.get(tab)
  if (cached && cached.expiresAt > Date.now()) return cached.rows

  const client = getAuthClient()
  const range = `${tab}!A1:Z1000`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`

  let values: string[][] | undefined
  try {
    const res = await client.request<{ values?: string[][] }>({ url })
    values = res.data.values
  } catch {
    throw new SheetsError('fetch_failed')
  }

  const rows = rowsToObjects(values ?? [])
  cache.set(tab, { expiresAt: Date.now() + CACHE_TTL_MS, rows })
  return rows
}

export async function updateSheetRange(tab: string, a1Range: string, values: string[][]): Promise<void> {
  if (!sheetsEnabled()) throw new SheetsError('disabled')
  if (!TAB_NAME_PATTERN.test(tab)) throw new SheetsError('invalid_tab')
  if (!A1_RANGE_PATTERN.test(a1Range)) throw new SheetsError('invalid_tab')

  const client = getAuthClient()
  const range = `${tab}!${a1Range}`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`

  try {
    await client.request({ url, method: 'PUT', data: { values } })
  } catch {
    throw new SheetsError('fetch_failed')
  }

  cache.delete(tab)
}

export async function appendSheetRow(tab: string, row: string[]): Promise<void> {
  if (!sheetsEnabled()) throw new SheetsError('disabled')
  if (!TAB_NAME_PATTERN.test(tab)) throw new SheetsError('invalid_tab')

  const client = getAuthClient()
  const range = `${tab}!A1:Z1000`
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`

  try {
    await client.request({ url, method: 'POST', data: { values: [row] } })
  } catch {
    throw new SheetsError('fetch_failed')
  }

  cache.delete(tab)
}
