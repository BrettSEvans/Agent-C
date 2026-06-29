import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { StateStore } from '../../src/domain/state-store'
import type { ProjectState } from '../../src/domain/schema'
import { tmpdir } from 'os'

describe('StateStore integration', () => {
  let tempDir: string
  let store: StateStore

  beforeEach(async () => {
    tempDir = join(tmpdir(), `test-state-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true })
    } catch (e) {
      // ignore
    }
  })

  it('reads and writes state.json', async () => {
    store = new StateStore(join(tempDir, 'state.json'))
    const state: ProjectState = {
      schemaVersion: 1,
      track: { type: 'product', name: 'Test', slug: null, productType: 'CLI' },
      currentStage: 'pm',
      stages: {
        pm: { status: 'in-progress', revisions: 0, criticPasses: 0, checkpoint: null },
        ux: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        ui: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        architect: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        engineer: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        qa: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null }
      },
      pendingFeedback: null,
      backlog: [],
      updatedAt: new Date().toISOString()
    }

    await store.write(state)
    const read = await store.read()
    expect(read).toEqual(state)
  })

  it('validates state on read', async () => {
    const invalidJson = '{ invalid json'
    store = new StateStore(join(tempDir, 'state.json'))
    await writeFile(store.filePath, invalidJson)

    await expect(store.read()).rejects.toThrow()
  })

  it('acquires lock before write', async () => {
    store = new StateStore(join(tempDir, 'state.json'))
    const state: ProjectState = {
      schemaVersion: 1,
      track: { type: 'product', name: 'Test', slug: null, productType: 'CLI' },
      currentStage: 'pm',
      stages: {
        pm: { status: 'in-progress', revisions: 0, criticPasses: 0, checkpoint: null },
        ux: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        ui: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        architect: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        engineer: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        qa: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null }
      },
      pendingFeedback: null,
      backlog: [],
      updatedAt: new Date().toISOString()
    }

    await store.write(state)
    // Write succeeded; verify lock was released
    expect(store.isLocked()).toBe(false)
  })

  it('wraps legacy string checkpoint into object', async () => {
    store = new StateStore(join(tempDir, 'state.json'))
    const legacyJson = JSON.stringify({
      schemaVersion: 1,
      track: { type: 'product', name: 'Test', slug: null, productType: 'CLI' },
      currentStage: 'pm',
      stages: {
        pm: { status: 'in-progress', revisions: 0, criticPasses: 0, checkpoint: 'old-string' },
        ux: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        ui: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        architect: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        engineer: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
        qa: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null }
      },
      pendingFeedback: null,
      updatedAt: new Date().toISOString()
    })
    await writeFile(join(tempDir, 'state.json'), legacyJson)

    const read = await store.read()
    // String checkpoint wraps into object
    expect(typeof read.stages.pm.checkpoint).toBe('object')
  })
})
