import { OAuth2Client } from 'google-auth-library'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? ''
const OAUTH_CLIENT_ID = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET ?? ''
const REFRESH_TOKEN = process.env.GOOGLE_SHEETS_REFRESH_TOKEN ?? ''
const CACHE_TTL_MS = Number(process.env.GOOGLE_SHEETS_CACHE_TTL_MS ?? 60_000)

const TAB_NAME_PATTERN = /^[\w -]+$/
const A1_RANGE_PATTERN = /^[A-Z]+\d+(:[A-Z]+\d*)?$/

type SheetTabData = {
  headers: string[]
  rows: Record<string, string>[]
}

let authClient: OAuth2Client | null = null
const cache = new Map<string, { expiresAt: number; data: SheetTabData }>()

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

function rowsToObjects(values: string[][]): SheetTabData {
  const [headers = [], ...rows] = values
  return {
    headers,
    rows: rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
    ),
  }
}

export class SheetsError extends Error {
  constructor(public code: 'disabled' | 'invalid_tab' | 'fetch_failed' | 'row_changed') {
    super(code)
  }
}

async function getSheetTabData(tab: string, forceRefresh = false): Promise<SheetTabData> {
  if (!sheetsEnabled()) throw new SheetsError('disabled')
  if (!TAB_NAME_PATTERN.test(tab)) throw new SheetsError('invalid_tab')

  const cached = cache.get(tab)
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.data

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

  const data = rowsToObjects(values ?? [])
  cache.set(tab, { expiresAt: Date.now() + CACHE_TTL_MS, data })
  return data
}

export async function getSheetTab(
  tab: string,
  options: { forceRefresh?: boolean } = {},
): Promise<Record<string, string>[]> {
  const data = await getSheetTabData(tab, options.forceRefresh)
  return data.rows
}

function columnLetter(index: number) {
  let value = index + 1
  let result = ''

  while (value > 0) {
    const remainder = (value - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    value = Math.floor((value - 1) / 26)
  }

  return result
}

export async function updateSheetCellByHeader(
  tab: string,
  rowNumber: number,
  header: string,
  value: string,
  expected: { header: string; value: string }[],
): Promise<void> {
  if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > 1000) {
    throw new SheetsError('invalid_tab')
  }

  const data = await getSheetTabData(tab, true)
  const row = data.rows[rowNumber - 2]
  const columnIndex = data.headers.indexOf(header)

  if (!row || columnIndex < 0 || expected.some((field) => row[field.header] !== field.value)) {
    throw new SheetsError('row_changed')
  }

  await updateSheetRange(tab, `${columnLetter(columnIndex)}${rowNumber}`, [[value]])
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
