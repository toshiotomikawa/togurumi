import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import type { PoolClient } from 'pg'
import { FaqError } from '../faq'
import { SiteContentError } from '../siteContent'
import { createRuntimeContentStores } from './contentStores'
import { loadLegacySnapshot, importLegacySnapshot } from './legacyImport'
import { localFaqStore, localSiteContentStore } from './localAdapters'
import { PostgresLegacyImportSink, runMigrations } from './postgres'
import { PostgresFaqStore, PostgresSiteContentStore } from './postgresContentStores'

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))

async function createTestStores() {
  const db = new PGlite()
  const migrationClient = {
    query: async (sql: string, params?: unknown[]) => {
      if (!params && sql.includes(';')) {
        await db.exec(sql)
        return { rows: [] }
      }
      return db.query(sql, params)
    },
  } as unknown as PoolClient
  await runMigrations(migrationClient, path.join(root, 'server', 'persistence', 'migrations'))
  return {
    db,
    site: new PostgresSiteContentStore(db as unknown as PoolClient),
    faq: new PostgresFaqStore(db as unknown as PoolClient),
  }
}

test('runtime selection keeps both local adapters when DATABASE_URL is absent', () => {
  assert.deepEqual(createRuntimeContentStores(''), {
    siteContentStore: localSiteContentStore,
    faqStore: localFaqStore,
  })
  const postgres = createRuntimeContentStores('postgres://example.invalid/togurumi')
  assert.ok(postgres.siteContentStore instanceof PostgresSiteContentStore)
  assert.ok(postgres.faqStore instanceof PostgresFaqStore)
})

test('site content reads defaults, updates fields and isolates locale and section', async () => {
  const { db, site } = await createTestStores()
  try {
    const englishHome = await site.get('en-US', 'home')
    const portugueseHome = await site.get('pt-BR', 'home')
    const englishAbout = await site.get('en-US', 'about')
    const updated = { ...englishHome, title: 'Updated home title' }

    assert.deepEqual(await site.update('en-US', 'home', updated), updated)
    assert.deepEqual(await site.get('en-US', 'home'), updated)
    assert.deepEqual(await site.get('pt-BR', 'home'), portugueseHome)
    assert.deepEqual(await site.get('en-US', 'about'), englishAbout)
  } finally {
    await db.close()
  }
})

test('FAQ reads defaults, normalizes updates and isolates locales', async () => {
  const { db, faq } = await createTestStores()
  try {
    const spanish = await faq.get('es-ES')
    const updated = await faq.update('en-US', {
      eyebrow: ' FAQ ',
      title: ' Questions ',
      intro: ' Answers ',
      items: [
        { question: ' Valid? ', answer: ' Yes. ' },
        { question: ' ', answer: 'Filtered' },
      ],
    })
    assert.deepEqual(updated, {
      eyebrow: 'FAQ', title: 'Questions', intro: 'Answers',
      items: [{ question: 'Valid?', answer: 'Yes.' }],
    })
    assert.deepEqual(await faq.get('en-US'), updated)
    assert.deepEqual(await faq.get('es-ES'), spanish)
  } finally {
    await db.close()
  }
})

test('stores preserve locale, section and payload validation errors', async () => {
  const { db, site, faq } = await createTestStores()
  try {
    await assert.rejects(site.get('fr-FR', 'home'),
      (error: unknown) => error instanceof SiteContentError && error.code === 'invalid_locale')
    await assert.rejects(site.get('en-US', 'missing'),
      (error: unknown) => error instanceof SiteContentError && error.code === 'invalid_section')
    await assert.rejects(site.update('en-US', 'home', {}),
      (error: unknown) => error instanceof SiteContentError && error.code === 'invalid_content')
    await assert.rejects(faq.get('fr-FR'),
      (error: unknown) => error instanceof FaqError && error.code === 'invalid_locale')
    await assert.rejects(faq.update('en-US', { title: 'Incomplete' }),
      (error: unknown) => error instanceof FaqError && error.code === 'invalid_content')

    await assert.rejects(db.query(
      "INSERT INTO site_content (locale, section, content) VALUES ('fr-FR', 'home', '{}'::jsonb)",
    ))
    await assert.rejects(db.query(
      "INSERT INTO faq_content (locale, content) VALUES ('fr-FR', '{}'::jsonb)",
    ))
  } finally {
    await db.close()
  }
})

test('repeated legacy import keeps every content and FAQ row without loss', async () => {
  const { db, site, faq } = await createTestStores()
  try {
    const snapshot = await loadLegacySnapshot(root)
    const sink = new PostgresLegacyImportSink(db as unknown as PoolClient)
    await importLegacySnapshot(snapshot, sink)
    await importLegacySnapshot(snapshot, sink)

    const siteCount = await db.query<{ count: string }>('SELECT count(*)::text AS count FROM site_content')
    const faqCount = await db.query<{ count: string }>('SELECT count(*)::text AS count FROM faq_content')
    assert.equal(Number(siteCount.rows[0]?.count), snapshot.siteContent.length)
    assert.equal(Number(faqCount.rows[0]?.count), snapshot.faq.length)

    for (const entry of snapshot.siteContent) {
      const loaded = await site.get(entry.locale, entry.section)
      for (const [field, value] of Object.entries(entry.content)) assert.equal(loaded[field], value)
    }
    for (const entry of snapshot.faq) {
      assert.deepEqual(await faq.get(entry.locale), entry.content)
    }
  } finally {
    await db.close()
  }
})
