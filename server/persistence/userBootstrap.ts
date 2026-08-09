import type { UserStore } from './contracts.js'
import type { UserRole } from '../store.js'

export type BootstrapAccount = {
  username: string
  password: string
  role: UserRole
}

export async function bootstrapUsers(store: UserStore, accounts: BootstrapAccount[]) {
  return Promise.all(accounts.map((account) => store.ensureSeed(account.username, account.password, account.role)))
}
