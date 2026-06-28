import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { readRegistry } from '../registry-reader'

describe('registry-reader', () => {
  let dir: string

  beforeEach(() => {
    dir = join(tmpdir(), `registry-reader-test-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('parses a valid registry.json and returns its entries', async () => {
    const registry = {
      version: 1,
      entries: [
        {
          id: 'tiffany',
          type: 'product',
          name: 'Tiffany',
          path: '/users/me/tiffany',
          slug: null,
          parentId: null,
          productType: 'GUI app',
          currentStage: 'ux',
          status: 'awaiting-approval',
          needsYou: true,
          revisionCount: 2,
          updatedAt: '2026-06-27T18:00:00Z'
        }
      ]
    }
    writeFileSync(join(dir, 'registry.json'), JSON.stringify(registry))
    const result = await readRegistry(join(dir, 'registry.json'))
    expect(result.data).not.toBeNull()
    expect(result.data!.entries).toHaveLength(1)
    expect(result.data!.entries[0].name).toBe('Tiffany')
    expect(result.warning).toBeUndefined()
  })

  it('ignores unknown fields on entries', async () => {
    const registry = {
      version: 1,
      entries: [
        {
          id: 'proj',
          type: 'product',
          name: 'Proj',
          path: '/users/me/proj',
          slug: null,
          parentId: null,
          productType: 'CLI',
          currentStage: 'pm',
          status: 'in-progress',
          needsYou: false,
          revisionCount: 0,
          updatedAt: '2026-06-27T18:00:00Z',
          unknownFutureField: 'ignored'
        }
      ]
    }
    writeFileSync(join(dir, 'registry.json'), JSON.stringify(registry))
    const result = await readRegistry(join(dir, 'registry.json'))
    expect(result.data).not.toBeNull()
    expect(result.data!.entries[0].name).toBe('Proj')
  })

  it('returns a warning when schemaVersion is a future major version', async () => {
    const registry = { version: 99, entries: [] }
    writeFileSync(join(dir, 'registry.json'), JSON.stringify(registry))
    const result = await readRegistry(join(dir, 'registry.json'))
    expect(result.data).not.toBeNull()
    expect(result.warning).toMatch(/schema/)
  })

  it('returns null data when the file does not exist', async () => {
    const result = await readRegistry(join(dir, 'nonexistent.json'))
    expect(result.data).toBeNull()
    expect(result.warning).toMatch(/not found/)
  })

  it('returns null data when JSON is corrupt', async () => {
    writeFileSync(join(dir, 'registry.json'), '{ broken json }}}')
    const result = await readRegistry(join(dir, 'registry.json'))
    expect(result.data).toBeNull()
    expect(result.warning).toMatch(/parse/)
  })

  it('defaults missing optional entry fields gracefully', async () => {
    const registry = {
      version: 1,
      entries: [
        {
          id: 'bare',
          type: 'product',
          name: 'Bare',
          path: '/users/me/bare'
        }
      ]
    }
    writeFileSync(join(dir, 'registry.json'), JSON.stringify(registry))
    const result = await readRegistry(join(dir, 'registry.json'))
    const entry = result.data!.entries[0]
    expect(entry.slug).toBeNull()
    expect(entry.parentId).toBeNull()
    expect(entry.needsYou).toBe(false)
    expect(entry.revisionCount).toBe(0)
  })
})
