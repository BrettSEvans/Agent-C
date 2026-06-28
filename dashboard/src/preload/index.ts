import { contextBridge, ipcRenderer } from 'electron'
import type { GitState, ProjectState, RegistryEntry } from '../shared/types'

export interface DashboardAPI {
  listProjects: () => Promise<RegistryEntry[]>
  readState: (projectPath: string) => Promise<ProjectState | null>
  getGitState: (projectPath: string) => Promise<GitState>
  refreshGit: (projectPath: string) => Promise<GitState>
  copyText: (text: string) => Promise<void>
  getRecent: () => Promise<string[]>
  addRecent: (projectPath: string) => Promise<void>
  onRegistryChange: (cb: () => void) => () => void
  onStateChange: (projectPath: string, cb: () => void) => () => void
}

const api: DashboardAPI = {
  listProjects: () => ipcRenderer.invoke('list-projects'),
  readState: (projectPath) => ipcRenderer.invoke('read-state', projectPath),
  getGitState: (projectPath) => ipcRenderer.invoke('get-git-state', projectPath),
  refreshGit: (projectPath) => ipcRenderer.invoke('refresh-git', projectPath),
  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  getRecent: () => ipcRenderer.invoke('get-recent'),
  addRecent: (projectPath) => ipcRenderer.invoke('add-recent', projectPath),

  onRegistryChange: (cb) => {
    const handler = (): void => cb()
    ipcRenderer.on('registry-changed', handler)
    return () => ipcRenderer.removeListener('registry-changed', handler)
  },

  onStateChange: (projectPath, cb) => {
    const handler = (_: unknown, changedPath: string): void => {
      if (changedPath === projectPath) cb()
    }
    ipcRenderer.on('state-changed', handler)
    return () => ipcRenderer.removeListener('state-changed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
