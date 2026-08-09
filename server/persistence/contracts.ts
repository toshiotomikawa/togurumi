import type { SessionData } from 'express-session'
import type { FaqContent } from '../faq'
import type {
  JournalLocale,
  JournalPostInput,
  JournalPostRecord,
  PublicJournalPost,
  PublicJournalPostWithBody,
} from '../journal'
import type { ReviewRecord } from '../reviews'
import type { SiteContentValues } from '../siteContent'
import type { UserRecord, UserRole } from '../store'

export interface UserStore {
  findByUsername(username: string): Promise<UserRecord | null>
  findByGoogleId(googleId: string): Promise<UserRecord | null>
  save(user: UserRecord): Promise<void>
  createWithPassword(username: string, password: string, role: UserRole): Promise<UserRecord>
  createWithGoogle(googleId: string, email: string, role: UserRole): Promise<UserRecord>
  ensureSeed(username: string, password: string, role: UserRole): Promise<UserRecord>
}

export interface ReviewStore {
  list(): Promise<ReviewRecord[]>
  add(input: { name: string; rating: number; comment: string }): Promise<ReviewRecord>
  delete(id: string): Promise<boolean>
}

export interface SiteContentStore {
  get(locale: string, section: string): Promise<SiteContentValues>
  update(locale: string, section: string, content: unknown): Promise<SiteContentValues>
}

export interface FaqStore {
  get(locale: string): Promise<FaqContent>
  update(locale: string, content: unknown): Promise<FaqContent>
}

export interface JournalStore {
  list(): Promise<JournalPostRecord[]>
  get(id: string): Promise<(JournalPostRecord & { body: string }) | null>
  create(input: JournalPostInput): Promise<JournalPostRecord & { body: string }>
  update(id: string, input: JournalPostInput): Promise<JournalPostRecord & { body: string }>
  delete(id: string): Promise<boolean>
  setArchived(id: string, archived: boolean): Promise<JournalPostRecord & { body: string }>
  listPublic(locale: JournalLocale, author?: string, includeArchived?: boolean): Promise<PublicJournalPost[]>
  getPublic(slug: string, locale: JournalLocale, includeArchived?: boolean): Promise<PublicJournalPostWithBody | null>
}

export interface SessionStore {
  get(sid: string): Promise<SessionData | null>
  set(sid: string, session: SessionData): Promise<void>
  destroy(sid: string): Promise<void>
  touch(sid: string, session: SessionData): Promise<void>
  revokeAllForUser(username: string, exceptSid?: string): Promise<void>
}

export interface RateLimitStore {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>
  reset(key: string): Promise<void>
  isLoginBlocked(key: string): Promise<boolean>
  registerLoginFailure(key: string, limit: number, blockMs: number): Promise<void>
}
