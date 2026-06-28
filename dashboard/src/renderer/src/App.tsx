import { useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { ProjectDetail } from './components/ProjectDetail'
import { FeatureDetail } from './components/FeatureDetail'
import { Footer } from './components/Footer'
import { useDashboardStore } from './store'
import type { RegistryEntry } from '../../shared/types'

declare global {
  interface Window {
    api: {
      listProjects: () => Promise<import('../../shared/types').RegistryEntry[]>
      readState: (path: string) => Promise<import('../../shared/types').ProjectState | null>
      getGitState: (path: string) => Promise<import('../../shared/types').GitState>
      refreshGit: (path: string) => Promise<import('../../shared/types').GitState>
      copyText: (text: string) => Promise<void>
      getRecent: () => Promise<string[]>
      addRecent: (path: string) => Promise<void>
      onRegistryChange: (cb: () => void) => () => void
      onStateChange: (path: string, cb: () => void) => () => void
    }
  }
}

async function loadGitState(
  entry: RegistryEntry,
  updateGitState: (path: string, state: import('../../shared/types').GitState) => void
): Promise<void> {
  try {
    const git = await window.api.getGitState(entry.path)
    updateGitState(entry.path, git)
  } catch {
    updateGitState(entry.path, {
      uncommittedCount: 0,
      unpushedCount: 0,
      computedAt: new Date().toISOString(),
      status: 'failed'
    })
  }
}

export default function App(): JSX.Element {
  const {
    selectedPath,
    projects,
    gitCache,
    projectStates,
    setProjects,
    setProjectState,
    updateGitState,
    setRecent,
    addRecent,
    selectProject,
    setSyncStatus
  } = useDashboardStore()

  const loadProjects = useCallback(async () => {
    setSyncStatus('syncing')
    try {
      const entries = await window.api.listProjects()
      setProjects(entries)
      const recent = await window.api.getRecent()
      setRecent(recent)
      setSyncStatus('idle')

      // Load state.json for all projects
      await Promise.all(
        entries.map(async (entry) => {
          const state = await window.api.readState(entry.path)
          if (state) setProjectState(entry.path, state)
        })
      )

      // Background batch git — fires in background, no await
      entries.forEach((entry) => loadGitState(entry, updateGitState))
    } catch {
      setSyncStatus('error')
    }
  }, [setProjects, setProjectState, updateGitState, setRecent, setSyncStatus])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const unsubRegistry = window.api.onRegistryChange(async () => {
      setSyncStatus('syncing')
      const entries = await window.api.listProjects()
      setProjects(entries)
      await Promise.all(
        entries.map(async (entry) => {
          const state = await window.api.readState(entry.path)
          if (state) setProjectState(entry.path, state)
        })
      )
      setSyncStatus('idle')
    })
    return unsubRegistry
  }, [setProjects, setProjectState, setSyncStatus])

  useEffect(() => {
    if (!selectedPath) return
    const unsubState = window.api.onStateChange(selectedPath, async () => {
      const state = await window.api.readState(selectedPath)
      if (state) setProjectState(selectedPath, state)
    })
    return unsubState
  }, [selectedPath, setProjectState])

  const selectedEntry = selectedPath
    ? projects.find((p) => p.path === selectedPath) ?? null
    : null
  const selectedState = selectedPath ? projectStates[selectedPath] ?? null : null
  const selectedGit = selectedPath ? gitCache[selectedPath] ?? null : null

  async function handleSelectProject(path: string): Promise<void> {
    selectProject(path)
    await window.api.addRecent(path)
    addRecent(path)
    // Trigger SWR revalidation if stale
    loadGitState(projects.find((p) => p.path === path)!, updateGitState)
  }

  async function handleRefreshGit(path: string): Promise<void> {
    updateGitState(path, {
      uncommittedCount: 0,
      unpushedCount: 0,
      computedAt: new Date().toISOString(),
      status: 'computing'
    })
    const fresh = await window.api.refreshGit(path)
    updateGitState(path, fresh)
  }

  const isFeature = selectedEntry?.type === 'feature'

  return (
    <div className="app">
      <Sidebar onSelect={handleSelectProject} />
      <main className="main-pane" role="main">
        {!selectedEntry && (
          <div className="main-pane__empty">
            <p>Select a project from the sidebar to view details.</p>
          </div>
        )}
        {selectedEntry && isFeature && (
          <FeatureDetail
            entry={selectedEntry}
            projectState={selectedState}
            gitState={selectedGit}
            onRefreshGit={() => handleRefreshGit(selectedEntry.path)}
            onBack={() => selectProject(selectedEntry.parentId ?? null)}
          />
        )}
        {selectedEntry && !isFeature && (
          <ProjectDetail
            entry={selectedEntry}
            projectState={selectedState}
            gitState={selectedGit}
            onRefreshGit={() => handleRefreshGit(selectedEntry.path)}
          />
        )}
      </main>
      <Footer onRefreshAll={loadProjects} />
    </div>
  )
}
