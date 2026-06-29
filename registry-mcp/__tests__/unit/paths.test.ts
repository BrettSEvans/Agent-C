import { describe, it, expect } from 'vitest'
import { resolvePaths, getTrackId } from '../../src/domain/paths'
import { homedir } from 'os'

describe('paths', () => {
  it('resolves product track paths', () => {
    const projectPath = '/home/user/my-project'
    const paths = resolvePaths(projectPath, 'product', null)
    expect(paths.statePath).toBe('/home/user/my-project/docs/product/state.json')
    expect(paths.backlogPath).toBe('/home/user/my-project/docs/product/backlog.md')
  })

  it('resolves feature track paths', () => {
    const projectPath = '/home/user/my-project'
    const paths = resolvePaths(projectPath, 'feature', 'dark-mode')
    expect(paths.statePath).toBe('/home/user/my-project/docs/features/dark-mode/state.json')
    expect(paths.backlogPath).toBe('/home/user/my-project/docs/features/dark-mode/backlog.md')
  })

  it('generates consistent track IDs for products', () => {
    const id1 = getTrackId('/home/user/project-a', null)
    const id2 = getTrackId('/home/user/project-a', null)
    expect(id1).toBe(id2)
  })

  it('generates distinct track IDs for features', () => {
    const id1 = getTrackId('/home/user/project-a', 'dark-mode')
    const id2 = getTrackId('/home/user/project-a', 'light-mode')
    expect(id1).not.toBe(id2)
  })

  it('resolves agent-c registry and event paths', () => {
    const paths = resolvePaths('', '', '')  // dummy, we just need the global paths
    expect(paths.registryPath).toMatch(/\.agent-c\/registry\.json$/)
    expect(paths.eventsPath).toMatch(/\.agent-c\/events\.ndjson$/)
    expect(paths.locksDir).toMatch(/\.agent-c\/locks$/)
  })
})
