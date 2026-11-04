import assert from 'node:assert/strict'
import test from 'node:test'
import type { UserStore } from './contracts.js'
import { bootstrapUsers } from './userBootstrap.js'

test('seeds accounts one at a time so the local JSON file is not rewritten concurrently', async () => {
  let active = 0
  let peak = 0
  const seeded: string[] = []

  const store = {
    ensureSeed: async (username: string) => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1
      seeded.push(username)
      return { username }
    },
  } as unknown as UserStore

  await bootstrapUsers(store, [
    { username: 'bella', password: 'one', role: 'admin' },
    { username: 'togurumi', password: 'two', role: 'moderator' },
  ])

  assert.equal(peak, 1)
  assert.deepEqual(seeded, ['bella', 'togurumi'])
})
