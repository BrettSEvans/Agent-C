import { create } from 'zustand'
import type { RegistryEntry, GitState, ProjectState } from '../../../shared/types'

export const STALE_THRESHOLD_MS = 30_000

interface DashboardState {
  projects: RegistryEntry[]
  selectedPath: string | null
  gitCache: Record<string, GitState>
  projectStates: Record<string, ProjectState>
  recentPaths: string[]
  searchQuery: string
  loading: boolean
  syncStatus: 'idle' | 'syncing' | 'error'

  // Derived
  filteredProjects: RegistryEntry[]

  // Actions
  setProjects: (projects: RegistryEntry[]) => void
  selectProject: (path: string | null) => void
  updateGitState: (path: string, state: GitState) => void
  setProjectState: (path: string, state: ProjectState) => void
  addRecent: (path: string) => void
  setRecent: (paths: string[]) => void
  setSearch: (query: string) => void
  setLoading: (loading: boolean) => void
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void
  isStale: (path: string) => boolean
  reset: () => void
}

const RECENT_MAX = 10

function computeFiltered(projects: RegistryEntry[], query: string): RegistryEntry[] {
  if (!query.trim()) return projects
  const q = query.toLowerCase()
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
  )
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  projects: [],
  selectedPath: null,
  gitCache: {},
  projectStates: {},
  recentPaths: [],
  searchQuery: '',
  loading: false,
  syncStatus: 'idle',
  filteredProjects: [],

  setProjects: (projects) =>
    set((s) => ({
      projects,
      filteredProjects: computeFiltered(projects, s.searchQuery)
    })),

  selectProject: (path) => set({ selectedPath: path }),

  updateGitState: (path, state) =>
    set((s) => ({ gitCache: { ...s.gitCache, [path]: state } })),

  setProjectState: (path, state) =>
    set((s) => ({ projectStates: { ...s.projectStates, [path]: state } })),

  addRecent: (path) =>
    set((s) => {
      const deduped = [path, ...s.recentPaths.filter((p) => p !== path)]
      return { recentPaths: deduped.slice(0, RECENT_MAX) }
    }),

  setRecent: (paths) => set({ recentPaths: paths }),

  setSearch: (query) =>
    set((s) => ({
      searchQuery: query,
      filteredProjects: computeFiltered(s.projects, query)
    })),

  setLoading: (loading) => set({ loading }),

  setSyncStatus: (syncStatus) => set({ syncStatus }),

  isStale: (path) => {
    const cached = get().gitCache[path]
    if (!cached) return true
    const ageMs = Date.now() - new Date(cached.computedAt).getTime()
    return ageMs >= STALE_THRESHOLD_MS
  },

  reset: () =>
    set({
      projects: [],
      selectedPath: null,
      gitCache: {},
      projectStates: {},
      recentPaths: [],
      searchQuery: '',
      loading: false,
      syncStatus: 'idle',
      filteredProjects: []
    })
}))
