import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { readState } from '../state-reader'

const validState = {
  schemaVersion: 1,
  track: { type: 'product', name: 'Tiffany', slug: null, productType: 'GUI app' },
  currentStage: 'ux',
  stages: {
    pm: { status: 'approved-complete', revisions: 0, criticPasses: 0, checkpoint: null },
    ux: { status: 'awaiting-approval', revisions: 2, criticPasses: 1, checkpoint: null },
    ui: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    architect: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    engineer: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    qa: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null }
  },
  pendingFeedback: null,
  updatedAt: '2026-06-28T00:00:00Z'
}

describe('state-reader', () => {
  let dir: string

  beforeEach(() => {
    dir = join(tmpdir(), `state-reader-test-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('parses a valid state.json', async () => {
    writeFileSync(join(dir, 'state.json'), JSON.stringify(validState))
    const result = await readState(join(dir, 'state.json'))
    expect(result.data).not.toBeNull()
    expect(result.data!.currentStage).toBe('ux')
    expect(result.data!.stages.pm.status).toBe('approved-complete')
    expect(result.data!.stages.ux.revisions).toBe(2)
    expect(result.warning).toBeUndefined()
  })

  it('defaults missing stage entries to not-started', async () => {
    const partial = { ...validState, stages: { pm: validState.stages.pm } }
    writeFileSync(join(dir, 'state.json'), JSON.stringify(partial))
    const result = await readState(join(dir, 'state.json'))
    expect(result.data!.stages.ux.status).toBe('not-started')
    expect(result.data!.stages.engineer.revisions).toBe(0)
  })

  it('returns null when file does not exist', async () => {
    const result = await readState(join(dir, 'nonexistent.json'))
    expect(result.data).toBeNull()
    expect(result.warning).toMatch(/not found/)
  })

  it('returns null and warning when JSON is corrupt', async () => {
    writeFileSync(join(dir, 'state.json'), '{ bad }')
    const result = await readState(join(dir, 'state.json'))
    expect(result.data).toBeNull()
    expect(result.warning).toMatch(/parse/)
  })

  it('returns warning when schema version is a future major version', async () => {
    const future = { ...validState, schemaVersion: 99 }
    writeFileSync(join(dir, 'state.json'), JSON.stringify(future))
    const result = await readState(join(dir, 'state.json'))
    expect(result.data).not.toBeNull()
    expect(result.warning).toMatch(/schema/)
  })

  it('preserves pendingFeedback when present', async () => {
    const withFeedback = {
      ...validState,
      pendingFeedback: {
        stage: 'ux',
        source: 'user',
        text: 'Needs more flows',
        reportPath: null
      }
    }
    writeFileSync(join(dir, 'state.json'), JSON.stringify(withFeedback))
    const result = await readState(join(dir, 'state.json'))
    expect(result.data!.pendingFeedback).not.toBeNull()
    expect(result.data!.pendingFeedback!.text).toBe('Needs more flows')
  })
})
