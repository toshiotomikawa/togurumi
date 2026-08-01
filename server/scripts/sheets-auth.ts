import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { resolve } from 'node:path'
import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET ?? ''
const PORT = 53682
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`
const ENV_PATH = resolve(process.cwd(), '.env')

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_SHEETS_OAUTH_CLIENT_ID and GOOGLE_SHEETS_OAUTH_CLIENT_SECRET in .env first.')
  process.exit(1)
}

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
const oauthState = randomBytes(24).toString('hex')
const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
  state: oauthState,
})

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function relayUrl() {
  const configuredUrl = (process.env.LAN_APP_URL ?? '')
    .split(',')
    .map((value) => value.trim())
    .find(Boolean)

  if (!configuredUrl) return `http://127.0.0.1:${PORT}`

  try {
    const url = new URL(configuredUrl)
    url.protocol = 'http:'
    url.port = String(PORT)
    url.pathname = '/'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return `http://127.0.0.1:${PORT}`
  }
}

function page(message = '') {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Togurumi Sheets authorization</title>
    <style>
      body { background: #f7f0e5; color: #3e3027; font: 17px/1.5 system-ui, sans-serif; margin: 0; }
      main { box-sizing: border-box; margin: 0 auto; max-width: 680px; min-height: 100vh; padding: 32px 20px; }
      .card { background: #fffaf3; border: 1px solid #decdbb; border-radius: 18px; padding: 24px; }
      h1 { font-size: 1.45rem; margin-top: 0; }
      ol { padding-left: 1.4rem; }
      li + li { margin-top: 12px; }
      a, button { background: #74513c; border: 0; border-radius: 999px; color: white; display: inline-block; font: inherit; font-weight: 700; padding: 11px 18px; text-decoration: none; }
      textarea { box-sizing: border-box; display: block; font: 14px/1.4 monospace; margin: 10px 0 14px; min-height: 130px; padding: 10px; width: 100%; }
      .message { background: #fff0d6; border-radius: 10px; padding: 10px 12px; }
      small { display: block; margin-top: 18px; }
    </style>
  </head>
  <body>
    <main>
      <div class="card">
        <h1>Connect Togurumi to Google Sheets</h1>
        ${message ? `<p class="message">${escapeHtml(message)}</p>` : ''}
        <ol>
          <li>Tap <strong>Authorize with Google</strong>. It opens in a new tab.</li>
          <li>Choose the Google account that can access the spreadsheet and approve access.</li>
          <li>The final page will say it cannot connect to <code>127.0.0.1</code>. That is expected on the phone.</li>
          <li>Copy the <strong>entire URL</strong> from that failed page, return to this tab, and paste it below.</li>
        </ol>
        <p><a href="${escapeHtml(authUrl)}" target="_blank" rel="noreferrer">Authorize with Google</a></p>
        <form method="post" action="/submit">
          <label for="callback_url"><strong>Final URL from Google</strong></label>
          <textarea id="callback_url" name="callback_url" required placeholder="http://127.0.0.1:53682/oauth2callback?code=..."></textarea>
          <button type="submit">Finish connection</button>
        </form>
        <small>This is a one-time page running on the Togurumi PC. The authorization code is sent only to that PC.</small>
      </div>
    </main>
  </body>
</html>`
}

async function readBody(req: http.IncomingMessage) {
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (body.length > 16_384) throw new Error('Submission is too large')
  }
  return body
}

async function saveRefreshToken(refreshToken: string) {
  const current = await readFile(ENV_PATH, 'utf8')
  const line = `GOOGLE_SHEETS_REFRESH_TOKEN=${refreshToken}`
  const next = /^GOOGLE_SHEETS_REFRESH_TOKEN=.*$/m.test(current)
    ? current.replace(/^GOOGLE_SHEETS_REFRESH_TOKEN=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`
  await writeFile(ENV_PATH, next, 'utf8')
}

async function exchangeCallback(callbackValue: string) {
  const callbackUrl = new URL(callbackValue.trim())
  if (callbackUrl.origin !== new URL(REDIRECT_URI).origin || callbackUrl.pathname !== '/oauth2callback') {
    throw new Error('Paste the complete 127.0.0.1 callback URL shown after Google approval')
  }
  if (callbackUrl.searchParams.get('state') !== oauthState) {
    throw new Error('This callback is not from the current authorization attempt. Start again from this page')
  }

  const oauthError = callbackUrl.searchParams.get('error')
  if (oauthError) throw new Error(`Google authorization failed: ${oauthError}`)

  const code = callbackUrl.searchParams.get('code')
  if (!code) throw new Error('The callback URL does not contain an authorization code')

  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Revoke the app in Google account permissions and try again')
  }
  await saveRefreshToken(tokens.refresh_token)
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page())
      return
    }

    if (req.method === 'GET' && req.url?.startsWith('/oauth2callback')) {
      await exchangeCallback(new URL(req.url, REDIRECT_URI).toString())
    } else if (req.method === 'POST' && req.url === '/submit') {
      const form = new URLSearchParams(await readBody(req))
      await exchangeCallback(form.get('callback_url') ?? '')
    } else {
      res.writeHead(404).end()
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page(
      'Success. The new token was saved on the Togurumi PC. You can close this page.',
    ))
    console.log('\nGoogle Sheets refresh token saved to .env.')
    server.close()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authorization failed'
    console.error(`Authorization failed: ${message}`)
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }).end(page(message))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('Open this one-time page on the phone:')
  console.log(`\n${relayUrl()}\n`)
  console.log('The phone and this PC must be able to reach each other on the network.')
})
