import { strict as assert } from 'node:assert'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { fallbackStarPath, readRatingStar } from './ratingStar'

test('private star: absent, supplied and malformed inputs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rating-star-'))
  const file = pathToFileURL(join(dir, 'star.svg'))
  try {
    assert.equal(readRatingStar(file), fallbackStarPath)
    writeFileSync(file, '<svg><path fill="currentColor" d="M0 0L10 10Z"/></svg>')
    assert.equal(readRatingStar(file), 'M0 0L10 10Z')
    for (const svg of ['<svg/>', '<svg><path d="M0 0"/><path d="M1 1"/></svg>', '<svg><path d="javascript:alert(1)"/></svg>']) {
      writeFileSync(file, svg)
      assert.throws(() => readRatingStar(file), /exactly one SVG path/)
    }
  } finally {
    rmSync(dir, { recursive: true })
  }
})
