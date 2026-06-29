import { describe, it, expect } from 'vitest'
import {
  StateSchema,
  RegistryEntrySchema,
  EventSchema,
  BacklogItemSchema,
  NotifyRegistrationSchema,
  CheckpointSchema
} from '../../src/domain/schema'

describe('schema validation', () => {
  it('validates a valid state.json', () => {
    const state = {
      schemaVersion: 1,
      track: {
        type: 'product',
        name: 'Test Project',
        slug: null,
        productType: 'GUI app'
      },
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
      updatedAt: '2026-06-29T12:00:00Z'
    }
    const result = StateSchema.safeParse(state)
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const state = {
      schemaVersion: 1,
      track: {
        type: 'product',
        name: 'Test Project',
        slug: null,
        productType: 'GUI app'
      },
      currentStage: 'pm',
      stages: {
        pm: { status: 'invalid', revisions: 0, criticPasses: 0, checkpoint: null }
      },
      pendingFeedback: null,
      backlog: [],
      updatedAt: '2026-06-29T12:00:00Z'
    }
    const result = StateSchema.safeParse(state)
    expect(result.success).toBe(false)
  })

  it('validates checkpoint as object or string or null', () => {
    const objCheckpoint = { sectionsCompleted: ['problem'], currentSection: 'users', draftPath: 'path', notes: 'notes' }
    const stringCheckpoint = 'old-format-string'
    const nullCheckpoint = null
    expect(CheckpointSchema.safeParse(objCheckpoint).success).toBe(true)
    expect(CheckpointSchema.safeParse(stringCheckpoint).success).toBe(true)
    expect(CheckpointSchema.safeParse(nullCheckpoint).success).toBe(true)
  })

  it('validates a registry entry', () => {
    const entry = {
      id: 'test-project',
      type: 'product',
      name: 'Test',
      path: '/path/to/project',
      slug: null,
      parentId: null,
      productType: 'GUI app',
      currentStage: 'pm',
      status: 'in-progress',
      needsYou: false,
      revisionCount: 0,
      updatedAt: '2026-06-29T12:00:00Z'
    }
    const result = RegistryEntrySchema.safeParse(entry)
    expect(result.success).toBe(true)
  })

  it('validates an event', () => {
    const event = {
      id: 'evt-1',
      type: 'stage-completed',
      trackId: 'project-1',
      stage: 'pm',
      at: '2026-06-29T12:00:00Z',
      payload: { artifactPath: 'docs/product/01-pm-brief.md', wasRevise: false }
    }
    const result = EventSchema.safeParse(event)
    expect(result.success).toBe(true)
  })

  it('validates backlog item', () => {
    const item = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      stage: 'pm',
      text: 'Add feature X',
      severity: 'high',
      status: 'open',
      createdAt: '2026-06-29T12:00:00Z'
    }
    const result = BacklogItemSchema.safeParse(item)
    expect(result.success).toBe(true)
  })

  it('validates notify registration', () => {
    const reg = {
      id: 'notify-1',
      eventTypes: ['stage-completed'],
      handler: 'telegram',
      target: '123456',
      filter: { trackId: 'project-1' }
    }
    const result = NotifyRegistrationSchema.safeParse(reg)
    expect(result.success).toBe(true)
  })
})
