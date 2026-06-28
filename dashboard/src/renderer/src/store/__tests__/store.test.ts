import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDashboardStore, STALE_THRESHOLD_MS } from '../index'
import type { RegistryEntry, GitState } from '../../../../shared/types'

const makeEntry = (overrides: Partial<RegistryEntry> = {}): RegistryEntry => ({
  id: 'proj',
  type: 'product',
  name: 'Proj',
  path: '/users/me/proj',
  slug: null,
  parentId: null,
  productType: 'GUI app',
  currentStage: 'pm',
  status: 'in-progress',
  needsYou: false,
  revisionCount: 0,
  updatedAt: '2026-06-28T00:00:00Z',
  ...overrides
})

const freshGit: GitState = {
  uncommittedCount: 1,
  unpushedCount: 0,
  computedAt: new Date().toISOString(),
  status: 'fresh'
}

describe('useDashboardStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => result.current.reset())
  })

  it('starts with empty projects and no selection', () => {
    const { result } = renderHook(() => useDashboardStore())
    expect(result.current.projects).toEqual([])
    expect(result.current.selectedPath).toBeNull()
  })

  it('setProjects replaces the project list', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => result.current.setProjects([makeEntry()]))
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].name).toBe('Proj')
  })

  it('selectProject sets the selectedPath', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.setProjects([makeEntry()])
      result.current.selectProject('/users/me/proj')
    })
    expect(result.current.selectedPath).toBe('/users/me/proj')
  })

  it('updateGitState stores the git state by path', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => result.current.updateGitState('/users/me/proj', freshGit))
    expect(result.current.gitCache['/users/me/proj']).toEqual(freshGit)
  })

  it('isStale returns false for a fresh entry', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => result.current.updateGitState('/users/me/proj', freshGit))
    expect(result.current.isStale('/users/me/proj')).toBe(false)
  })

  it('isStale returns true for an entry older than STALE_THRESHOLD_MS', () => {
    const { result } = renderHook(() => useDashboardStore())
    const oldGit: GitState = {
      ...freshGit,
      computedAt: new Date(Date.now() - STALE_THRESHOLD_MS - 1000).toISOString()
    }
    act(() => result.current.updateGitState('/users/me/proj', oldGit))
    expect(result.current.isStale('/users/me/proj')).toBe(true)
  })

  it('isStale returns true when no cache entry exists', () => {
    const { result } = renderHook(() => useDashboardStore())
    expect(result.current.isStale('/unknown/path')).toBe(true)
  })

  it('addRecent adds path to front of recent list', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addRecent('/a')
      result.current.addRecent('/b')
    })
    expect(result.current.recentPaths[0]).toBe('/b')
  })

  it('addRecent deduplicates and moves to front', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addRecent('/a')
      result.current.addRecent('/b')
      result.current.addRecent('/a')
    })
    expect(result.current.recentPaths[0]).toBe('/a')
    expect(result.current.recentPaths.filter((p) => p === '/a')).toHaveLength(1)
  })

  it('filters projects by search query (case-insensitive name match)', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.setProjects([
        makeEntry({ id: '1', name: 'Tiffany', path: '/a' }),
        makeEntry({ id: '2', name: 'SecureFile', path: '/b' })
      ])
      result.current.setSearch('tiff')
    })
    expect(result.current.filteredProjects).toHaveLength(1)
    expect(result.current.filteredProjects[0].name).toBe('Tiffany')
  })

  it('returns all projects when search is empty', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.setProjects([
        makeEntry({ id: '1', path: '/a' }),
        makeEntry({ id: '2', path: '/b' })
      ])
      result.current.setSearch('')
    })
    expect(result.current.filteredProjects).toHaveLength(2)
  })
})
