import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchJournalPost, fetchJournalPosts } from '../../src/lib/journal.js'

function withFetch(response: Response, run: () => Promise<void>) {
  const original = globalThis.fetch
  globalThis.fetch = async () => response
  return run().finally(() => { globalThis.fetch = original })
}

test('journal list distinguishes an empty success from an API failure', { concurrency: false }, async () => {
  await withFetch(new Response(JSON.stringify({ posts: [] }), { status: 200 }), async () => {
    assert.deepEqual(await fetchJournalPosts('en-US'), [])
  })
  await withFetch(new Response(null, { status: 500 }), async () => {
    await assert.rejects(fetchJournalPosts('en-US'), /journal_load_failed/)
  })
})

test('journal post distinguishes not_found from an API failure', { concurrency: false }, async () => {
  await withFetch(new Response(null, { status: 404 }), async () => {
    assert.equal(await fetchJournalPost('missing', 'en-US'), undefined)
  })
  await withFetch(new Response(null, { status: 503 }), async () => {
    await assert.rejects(fetchJournalPost('available', 'en-US'), /journal_load_failed/)
  })
})
