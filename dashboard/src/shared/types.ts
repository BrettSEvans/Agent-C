export type ProjectType = 'product' | 'feature'

export type StageStatus =
  | 'not-started'
  | 'in-progress'
  | 'awaiting-approval'
  | 'approved-complete'
  | 'skipped'
  | 'unreachable'
  | 'error'

export type Stage = 'pm' | 'ux' | 'ui' | 'architect' | 'engineer' | 'qa'

export type GitComputeStatus = 'fresh' | 'cached' | 'computing' | 'failed' | 'unknown'

export interface Project {
  path: string
  name: string
  type: ProjectType
  parentPath?: string
  lastUpdated: string
}

export interface StageInfo {
  status: StageStatus
  revisions: number
  criticPasses: number
  checkpoint: string | null
}

export interface PendingFeedback {
  stage: Stage
  source: 'user' | 'critic'
  text: string
  reportPath: string | null
}

export interface ProjectState {
  schemaVersion: number
  track: {
    type: ProjectType
    name: string
    slug: string | null
    productType: string
  }
  currentStage: Stage
  stages: Record<Stage, StageInfo>
  pendingFeedback: PendingFeedback | null
  updatedAt: string
}

export interface UncommittedFile {
  statusCode: string  // e.g. 'M ', ' M', '??', 'A ', 'D '
  label: string       // human label: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'
  path: string
}

export interface GitState {
  uncommittedCount: number
  uncommittedFiles: UncommittedFile[]
  unpushedCount: number
  computedAt: string
  status: GitComputeStatus
  lastKnown?: {
    uncommittedCount: number
    unpushedCount: number
    computedAt: string
  }
}

export interface RegistryEntry {
  id: string
  type: ProjectType
  name: string
  path: string
  slug: string | null
  parentId: string | null
  productType: string
  currentStage: Stage
  status: StageStatus
  needsYou: boolean
  revisionCount: number
  updatedAt: string
}

export interface Registry {
  version: number
  entries: RegistryEntry[]
}

export interface ParseResult<T> {
  data: T | null
  warning?: string
}
