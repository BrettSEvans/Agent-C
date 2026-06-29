import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { RegistryStore } from '../../src/domain/registry-store'
import { tmpdir } from 'os'

describe('RegistryStore', () => {
  let tempDir: string
  let registryPath: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `test-registry-${Date.now()}`)
    registryPath = join(tempDir, 'registry.json')
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true })
    } catch (e) {
      // ignore
    }
  })

  it('initializes empty registry if file does not exist', async () => {
    const store = new RegistryStore(registryPath)
    const registry = await store.read()
    expect(registry.version).toBe(1)
    expect(registry.entries).toEqual([])
  })

  it('reads existing registry', async () => {
    const initialRegistry = {
      version: 1,
      entries: [
        {
          id: 'test-project',
          type: 'product',
          name: 'Test',
          path: '/path/to/test',
          slug: null,
          parentId: null,
          productType: 'CLI',
          currentStage: 'pm',
          status: 'in-progress',
          needsYou: true,
          revisionCount: 0,
          updatedAt: '2026-06-29T12:00:00Z'
        }
      ]
    }
    await writeFile(registryPath, JSON.stringify(initialRegistry))

    const store = new RegistryStore(registryPath)
    const registry = await store.read()
    expect(registry.entries).toHaveLength(1)
    expect(registry.entries[0].id).toBe('test-project')
  })

  it('writes registry', async () => {
    const store = new RegistryStore(registryPath)
    const entry = {
      id: 'new-project',
      type: 'product' as const,
      name: 'New',
      path: '/path/to/new',
      slug: null,
      parentId: null,
      productType: 'GUI app',
      currentStage: 'pm' as const,
      status: 'not-started' as const,
      needsYou: false,
      revisionCount: 0,
      updatedAt: new Date().toISOString()
    }

    let registry = await store.read()
    registry.entries.push(entry)
    await store.write(registry)

    const reread = await store.read()
    expect(reread.entries).toHaveLength(1)
    expect(reread.entries[0].id).toBe('new-project')
  })
})
