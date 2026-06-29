import { homedir } from 'os'
import { join } from 'path'

export interface Paths {
  statePath: string
  backlogPath: string
  registryPath: string
  eventsPath: string
  notifyPath: string
  verifyCachePath: string
  locksDir: string
}

export function resolvePaths(projectPath: string, type: 'product' | 'feature' | '', slug: string | null | ''): Paths {
  const agentCDir = join(homedir(), '.agent-c')

  let docsDir: string
  if (type === 'product') {
    docsDir = join(projectPath, 'docs', 'product')
  } else if (type === 'feature') {
    docsDir = join(projectPath, 'docs', 'features', slug || '')
  } else {
    docsDir = ''
  }

  return {
    statePath: join(docsDir, 'state.json'),
    backlogPath: join(docsDir, 'backlog.md'),
    registryPath: join(agentCDir, 'registry.json'),
    eventsPath: join(agentCDir, 'events.ndjson'),
    notifyPath: join(agentCDir, 'notify.json'),
    verifyCachePath: join(agentCDir, 'verify-cache.json'),
    locksDir: join(agentCDir, 'locks')
  }
}

export function getTrackId(projectPath: string, slug: string | null): string {
  if (slug === null) {
    // For products, use a normalized path hash (simple approach for v1)
    return projectPath.split('/').filter(Boolean).join('-').toLowerCase()
  }
  // For features, include the slug
  return `${projectPath.split('/').filter(Boolean).join('-').toLowerCase()}/${slug}`
}
