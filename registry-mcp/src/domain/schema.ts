import { z } from 'zod'

export const StageSchema = z.enum(['pm', 'ux', 'ui', 'architect', 'engineer', 'qa'])
export type Stage = z.infer<typeof StageSchema>

export const StatusSchema = z.enum([
  'not-started',
  'in-progress',
  'awaiting-approval',
  'approved-complete',
  'skipped',
  'unreachable',
  'error'
])
export type Status = z.infer<typeof StatusSchema>

export const CheckpointSchema = z.union([
  z.object({
    sectionsCompleted: z.string().array(),
    currentSection: z.string(),
    draftPath: z.string().optional(),
    notes: z.string().optional()
  }),
  z.string(),  // legacy format
  z.null()
])
export type Checkpoint = z.infer<typeof CheckpointSchema>

export const StageInfoSchema = z.object({
  status: StatusSchema,
  revisions: z.number().int().nonnegative(),
  criticPasses: z.number().int().nonnegative(),
  checkpoint: CheckpointSchema
})
export type StageInfo = z.infer<typeof StageInfoSchema>

export const PendingFeedbackSchema = z.object({
  stage: StageSchema,
  source: z.enum(['user', 'critic']),
  text: z.string(),
  reportPath: z.string().nullable()
})
export type PendingFeedback = z.infer<typeof PendingFeedbackSchema>

export const BacklogItemSchema = z.object({
  id: z.string().uuid(),
  stage: StageSchema,
  text: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'done', 'wontfix']),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional()
})
export type BacklogItem = z.infer<typeof BacklogItemSchema>

export const StateSchema = z.object({
  schemaVersion: z.literal(1),
  track: z.object({
    type: z.enum(['product', 'feature']),
    name: z.string(),
    slug: z.string().nullable(),
    productType: z.string()
  }),
  currentStage: StageSchema,
  stages: z.record(StageSchema, StageInfoSchema),
  pendingFeedback: PendingFeedbackSchema.nullable(),
  backlog: BacklogItemSchema.array().default([]),
  updatedAt: z.string().datetime()
})
export type ProjectState = z.infer<typeof StateSchema>

export const RegistryEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['product', 'feature']),
  name: z.string(),
  path: z.string(),
  slug: z.string().nullable(),
  parentId: z.string().nullable(),
  productType: z.string(),
  currentStage: StageSchema,
  status: StatusSchema,
  needsYou: z.boolean(),
  revisionCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime()
})
export type RegistryEntry = z.infer<typeof RegistryEntrySchema>

export const RegistrySchema = z.object({
  version: z.literal(1),
  entries: RegistryEntrySchema.array()
})
export type Registry = z.infer<typeof RegistrySchema>

export const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  trackId: z.string(),
  stage: StageSchema.optional(),
  at: z.string().datetime(),
  payload: z.record(z.unknown())
})
export type Event = z.infer<typeof EventSchema>

export const NotifyRegistrationSchema = z.object({
  id: z.string(),
  eventTypes: z.string().array(),
  handler: z.enum(['webhook', 'push', 'telegram']),
  target: z.string(),
  filter: z.object({
    trackId: z.string().optional(),
    stage: StageSchema.optional()
  }).optional()
})
export type NotifyRegistration = z.infer<typeof NotifyRegistrationSchema>

export const VerifyCacheEntrySchema = z.object({
  subject: z.string(),
  ecosystem: z.string().optional(),
  finding: z.string(),
  source: z.string(),
  checkedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
})
export type VerifyCacheEntry = z.infer<typeof VerifyCacheEntrySchema>
