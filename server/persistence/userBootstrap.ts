import type { UserStore } from './contracts.js'
import type { UserRole } from '../store.js'

export type BootstrapAccount = {
  username: string
  password: string
  role: UserRole
}

export async function bootstrapUsers(store: UserStore, accounts: BootstrapAccount[]) {
  // Sequential: the local user store rewrites data/users.json on every seed,
  // so concurrent seeds can truncate each other's file.
  const seeded = []
  for (const account of accounts) {
    seeded.push(await store.ensureSeed(account.username, account.password, account.role))
  }
  return seeded
}
