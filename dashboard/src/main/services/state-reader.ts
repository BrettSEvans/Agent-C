import { readFile } from 'fs/promises'
import type {
  ProjectState,
  StageInfo,
  Stage,
  PendingFeedback,
  ParseResult
} from '../../shared/types'

const SUPPORTED_SCHEMA_VERSION = 1

const ALL_STAGES: Stage[] = ['pm', 'ux', 'ui', 'architect', 'engineer', 'qa']

const DEFAULT_STAGE: StageInfo = {
  status: 'not-started',
  revisions: 0,
  criticPasses: 0,
  checkpoint: null
}

function normalizeStageInfo(raw: unknown): StageInfo {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_STAGE }
  const r = raw as Record<string, unknown>
  return {
    status: (r.status as StageInfo['status']) ?? 'not-started',
    revisions: Number(r.revisions ?? 0),
    criticPasses: Number(r.criticPasses ?? 0),
    checkpoint: r.checkpoint != null ? String(r.checkpoint) : null
  }
}

function normalizePendingFeedback(raw: unknown): PendingFeedback | null {
  if (raw == null) return null
  if (typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return {
    stage: (r.stage as Stage) ?? 'pm',
    source: (r.source as 'user' | 'critic') ?? 'user',
    text: String(r.text ?? ''),
    reportPath: r.reportPath != null ? String(r.reportPath) : null
  }
}

export async function readState(filePath: string): Promise<ParseResult<ProjectState>> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch {
    return { data: null, warning: 'State file not found' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { data: null, warning: 'Failed to parse state.json: invalid JSON' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { data: null, warning: 'Failed to parse state.json: not an object' }
  }

  const obj = parsed as Record<string, unknown>
  const version = Number(obj.schemaVersion ?? 1)
  const warning =
    version > SUPPORTED_SCHEMA_VERSION
      ? `State schema version ${version} is newer than supported (${SUPPORTED_SCHEMA_VERSION}) — some data may be incomplete`
      : undefined

  const rawStages = (typeof obj.stages === 'object' && obj.stages !== null ? obj.stages : {}) as Record<string, unknown>
  const stages = Object.fromEntries(
    ALL_STAGES.map((stage) => [stage, normalizeStageInfo(rawStages[stage])])
  ) as Record<Stage, StageInfo>

  const track =
    typeof obj.track === 'object' && obj.track !== null
      ? (obj.track as Record<string, unknown>)
      : {}

  const data: ProjectState = {
    schemaVersion: version,
    track: {
      type: (track.type as ProjectState['track']['type']) ?? 'product',
      name: String(track.name ?? ''),
      slug: track.slug != null ? String(track.slug) : null,
      productType: String(track.productType ?? '')
    },
    currentStage: (obj.currentStage as Stage) ?? 'pm',
    stages,
    pendingFeedback: normalizePendingFeedback(obj.pendingFeedback),
    updatedAt: String(obj.updatedAt ?? '')
  }

  return { data, warning }
}
