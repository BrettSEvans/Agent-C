import { describe, it, expect } from 'vitest'
import { StateMachine } from '../../src/domain/state-machine'
import type { ProjectState, Stage } from '../../src/domain/schema'

function createEmptyState(): ProjectState {
  return {
    schemaVersion: 1,
    track: { type: 'product', name: 'Test', slug: null, productType: 'CLI' },
    currentStage: 'pm',
    stages: {
      pm: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
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
}

describe('StateMachine', () => {
  it('allows complete() from in-progress to awaiting-approval', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'

    const result = StateMachine.complete(state, 'pm', 'path/to/artifact.md')
    expect(result.stages.pm.status).toBe('awaiting-approval')
    expect(result.stages.pm.checkpoint).toBeNull()
  })

  it('rejects complete() if earlier stage is not approved or skipped', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'
    state.stages.ux.status = 'in-progress'

    expect(() => {
      StateMachine.complete(state, 'ux', 'path/to/artifact.md')
    }).toThrow('Earlier stage pm is not approved or skipped')
  })

  it('allows approve() from awaiting-approval', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'awaiting-approval'

    const result = StateMachine.approve(state, 'pm')
    expect(result.stages.pm.status).toBe('approved-complete')
    expect(result.currentStage).toBe('ux')
  })

  it('rejects approve() if not awaiting-approval', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'

    expect(() => {
      StateMachine.approve(state, 'pm')
    }).toThrow('Stage pm is not awaiting-approval')
  })

  it('allows requestChanges() to set pending feedback', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'awaiting-approval'

    const result = StateMachine.requestChanges(state, 'pm', 'Needs more detail')
    expect(result.pendingFeedback).toEqual({
      stage: 'pm',
      source: 'user',
      text: 'Needs more detail',
      reportPath: null
    })
  })

  it('detects revise mode and increments revisions', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'
    state.stages.pm.revisions = 1
    state.pendingFeedback = {
      stage: 'pm',
      source: 'user',
      text: 'Fix this',
      reportPath: null
    }

    const result = StateMachine.complete(state, 'pm', 'path/to/artifact.md')
    expect(result.stages.pm.revisions).toBe(2)
    expect(result.pendingFeedback).toBeNull()
  })

  it('allows skip() from not-started', () => {
    const state = createEmptyState()
    state.stages.ux.status = 'not-started'

    const result = StateMachine.skip(state, 'ux', 'Out of scope')
    expect(result.stages.ux.status).toBe('skipped')
    expect(result.currentStage).toBe('ui')
  })

  it('rejects skip() from other statuses', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'

    expect(() => {
      StateMachine.skip(state, 'pm', 'Out of scope')
    }).toThrow('Stage pm is not not-started')
  })

  it('allows checkpoint() to update sections', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'

    const result = StateMachine.checkpoint(state, 'pm', {
      sectionsCompleted: ['problem'],
      currentSection: 'users',
      draftPath: 'docs/product/01-pm-brief.md',
      notes: 'User wants B2B'
    })
    expect(result.stages.pm.checkpoint).toEqual({
      sectionsCompleted: ['problem'],
      currentSection: 'users',
      draftPath: 'docs/product/01-pm-brief.md',
      notes: 'User wants B2B'
    })
  })

  it('does not mutate input state in complete()', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'
    const originalStatus = state.stages.pm.status

    StateMachine.complete(state, 'pm', 'path/to/artifact.md')
    expect(state.stages.pm.status).toBe(originalStatus)
  })

  it('does not mutate input state in approve()', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'awaiting-approval'
    const originalStage = state.currentStage

    StateMachine.approve(state, 'pm')
    expect(state.currentStage).toBe(originalStage)
  })

  it('handles multi-stage completion flow', () => {
    let state = createEmptyState()

    // PM: in-progress -> awaiting-approval -> approved-complete
    state.stages.pm.status = 'in-progress'
    state = StateMachine.complete(state, 'pm', 'docs/product/01-pm-brief.md')
    expect(state.stages.pm.status).toBe('awaiting-approval')

    state = StateMachine.approve(state, 'pm')
    expect(state.stages.pm.status).toBe('approved-complete')
    expect(state.currentStage).toBe('ux')

    // UX: in-progress -> awaiting-approval -> approved-complete
    state.stages.ux.status = 'in-progress'
    state = StateMachine.complete(state, 'ux', 'docs/product/02-ux-workflow.md')
    expect(state.stages.ux.status).toBe('awaiting-approval')

    state = StateMachine.approve(state, 'ux')
    expect(state.stages.ux.status).toBe('approved-complete')
    expect(state.currentStage).toBe('ui')
  })

  it('allows complete() to next stage if previous is skipped', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'approved-complete'
    state.stages.ux.status = 'skipped'
    state.stages.ui.status = 'in-progress'

    const result = StateMachine.complete(state, 'ui', 'docs/ui/styles.md')
    expect(result.stages.ui.status).toBe('awaiting-approval')
  })

  it('rejects complete() if checkpoint is set without clear intent', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'in-progress'
    state.stages.pm.checkpoint = {
      sectionsCompleted: ['problem'],
      currentSection: 'users',
      draftPath: 'docs/product/01-pm-brief.md',
      notes: null
    }

    const result = StateMachine.complete(state, 'pm', 'path/to/artifact.md')
    expect(result.stages.pm.checkpoint).toBeNull()
  })

  it('clears pending feedback after approval', () => {
    const state = createEmptyState()
    state.stages.pm.status = 'awaiting-approval'
    state.pendingFeedback = {
      stage: 'ux',
      source: 'user',
      text: 'Fix this',
      reportPath: null
    }

    const result = StateMachine.approve(state, 'pm')
    expect(result.pendingFeedback).not.toBeNull()
    expect(result.pendingFeedback?.stage).toBe('ux')
  })
})
