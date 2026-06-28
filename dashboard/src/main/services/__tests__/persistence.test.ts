import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createPersistence } from '../persistence'

describe('persistence', () => {
  let userDataDir: string

  beforeEach(() => {
    userDataDir = join(tmpdir(), `persistence-test-${Date.now()}`)
    mkdirSync(userDataDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(userDataDir, { recursive: true, force: true })
  })

  describe('recently opened', () => {
    it('saves and loads a recently-opened path', async () => {
      const p = createPersistence(userDataDir)
      await p.addRecent('/users/me/proj')
      const recent = await p.getRecent()
      expect(recent).toContain('/users/me/proj')
    })

    it('deduplicates: adding same path again moves it to front', async () => {
      const p = createPersistence(userDataDir)
      await p.addRecent('/a')
      await p.addRecent('/b')
      await p.addRecent('/a')
      const recent = await p.getRecent()
      expect(recent[0]).toBe('/a')
      expect(recent.filter((r) => r === '/a')).toHaveLength(1)
    })

    it('trims list to 10 most-recent entries', async () => {
      const p = createPersistence(userDataDir)
      for (let i = 0; i < 15; i++) {
        await p.addRecent(`/path/${i}`)
      }
      const recent = await p.getRecent()
      expect(recent.length).toBe(10)
      expect(recent[0]).toBe('/path/14')
    })

    it('returns empty array when no data file exists', async () => {
      const p = createPersistence(userDataDir)
      const recent = await p.getRecent()
      expect(recent).toEqual([])
    })
  })

  describe('git cache', () => {
    const gitState = {
      uncommittedCount: 2,
      unpushedCount: 1,
      computedAt: '2026-06-28T00:00:00Z',
      status: 'fresh' as const
    }

    it('saves and loads git state for a path', async () => {
      const p = createPersistence(userDataDir)
      await p.saveGitCache('/users/me/proj', gitState)
      const loaded = await p.getGitCache('/users/me/proj')
      expect(loaded).not.toBeNull()
      expect(loaded!.uncommittedCount).toBe(2)
      expect(loaded!.status).toBe('fresh')
    })

    it('returns null for an uncached path', async () => {
      const p = createPersistence(userDataDir)
      const loaded = await p.getGitCache('/no/such/path')
      expect(loaded).toBeNull()
    })

    it('updates existing cache entry', async () => {
      const p = createPersistence(userDataDir)
      await p.saveGitCache('/users/me/proj', gitState)
      await p.saveGitCache('/users/me/proj', { ...gitState, uncommittedCount: 5 })
      const loaded = await p.getGitCache('/users/me/proj')
      expect(loaded!.uncommittedCount).toBe(5)
    })
  })
})
