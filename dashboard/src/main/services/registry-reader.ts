import { readFile } from 'fs/promises'
import type { Registry, RegistryEntry, ParseResult } from '../../shared/types'

const SUPPORTED_SCHEMA_VERSION = 1

function normalizeEntry(raw: Record<string, unknown>): RegistryEntry {
  return {
    id: String(raw.id ?? ''),
    type: (raw.type as RegistryEntry['type']) ?? 'product',
    name: String(raw.name ?? ''),
    path: String(raw.path ?? ''),
    slug: raw.slug != null ? String(raw.slug) : null,
    parentId: raw.parentId != null ? String(raw.parentId) : null,
    productType: String(raw.productType ?? ''),
    currentStage: (raw.currentStage as RegistryEntry['currentStage']) ?? 'pm',
    status: (raw.status as RegistryEntry['status']) ?? 'not-started',
    needsYou: Boolean(raw.needsYou ?? false),
    revisionCount: Number(raw.revisionCount ?? 0),
    updatedAt: String(raw.updatedAt ?? '')
  }
}

export async function readRegistry(filePath: string): Promise<ParseResult<Registry>> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch {
    return { data: null, warning: 'Registry file not found' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { data: null, warning: 'Failed to parse registry.json: invalid JSON' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { data: null, warning: 'Failed to parse registry.json: not an object' }
  }

  const obj = parsed as Record<string, unknown>
  const version = Number(obj.version ?? 1)
  const warning =
    version > SUPPORTED_SCHEMA_VERSION
      ? `Registry schema version ${version} is newer than supported (${SUPPORTED_SCHEMA_VERSION}) — some data may be incomplete`
      : undefined

  const rawEntries = Array.isArray(obj.entries) ? obj.entries : []
  const entries = rawEntries
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map(normalizeEntry)

  return { data: { version, entries }, warning }
}
