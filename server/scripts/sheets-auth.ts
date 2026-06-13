import 'dotenv/config'
import http from 'node:http'
import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET ?? ''
const PORT = 53682
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set GOOGLE_SHEETS_OAUTH_CLIENT_ID and GOOGLE_SHEETS_OAUTH_CLIENT_SECRET in .env first.')
  process.exit(1)
}

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
})

console.log('Open this URL in your browser and sign in with the Google account that has access to the sheet:\n')
console.log(authUrl)
console.log(`\nWaiting for redirect on ${REDIRECT_URI} ...`)

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith('/oauth2callback')) {
    res.writeHead(404).end()
    return
  }

  const url = new URL(req.url, REDIRECT_URI)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Authorization failed: ${error}`)
    console.error(`Authorization failed: ${error}`)
    server.close()
    process.exit(1)
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Missing code')
    return
  }

  try {
    const { tokens } = await client.getToken(code)
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Success! You can close this tab and return to the terminal.')

    if (!tokens.refresh_token) {
      console.error(
        '\nNo refresh token returned. If you have authorized this app before, revoke access at ' +
          'https://myaccount.google.com/permissions and run this script again.',
      )
      process.exit(1)
    }

    console.log('\nAdd this to your .env file:\n')
    console.log(`GOOGLE_SHEETS_REFRESH_TOKEN=${tokens.refresh_token}`)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Token exchange failed')
    console.error('Token exchange failed:', err)
  } finally {
    server.close()
  }
})

server.listen(PORT)
