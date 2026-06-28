import { ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { readRegistry } from '../services/registry-reader'
import { readState } from '../services/state-reader'
import { gitService } from '../services/git-service'
import { WatcherService } from '../services/watcher-service'
import { createPersistence } from '../services/persistence'
import { copyText } from '../services/clipboard-service'
import type { GitState, RegistryEntry, ProjectState } from '../../shared/types'

const REGISTRY_PATH =
  process.env.AGENT_C_REGISTRY ??
  join(homedir(), '.agent-c', 'registry.json')

const gitCache = new Map<string, GitState>()
const watcher = new WatcherService()
let persistence: ReturnType<typeof createPersistence>

function getStatePath(projectPath: string): string {
  return join(projectPath, 'docs', 'product', 'state.json')
}

async function loadAllProjects(): Promise<RegistryEntry[]> {
  const result = await readRegistry(REGISTRY_PATH)
  return result.data?.entries ?? []
}

async function startWatching(entries: RegistryEntry[]): Promise<void> {
  const statePaths = new Map<string, string>()
  for (const entry of entries) {
    statePaths.set(entry.path, getStatePath(entry.path))
  }
  watcher.start(REGISTRY_PATH, statePaths)
}

export function registerIpcHandlers(win: BrowserWindow, userDataPath: string): void {
  persistence = createPersistence(userDataPath)

  ipcMain.handle('list-projects', async (): Promise<RegistryEntry[]> => {
    const entries = await loadAllProjects()
    await startWatching(entries)
    return entries
  })

  ipcMain.handle(
    'read-state',
    async (_event, projectPath: string): Promise<ProjectState | null> => {
      const result = await readState(getStatePath(projectPath))
      return result.data
    }
  )

  ipcMain.handle('get-git-state', async (_event, projectPath: string): Promise<GitState> => {
    const cached = gitCache.get(projectPath)
    if (cached) {
      const ageMs = Date.now() - new Date(cached.computedAt).getTime()
      if (ageMs < 30_000) {
        return { ...cached, status: 'cached' }
      }
    }

    const fresh = await gitService.getGitState(projectPath)
    gitCache.set(projectPath, fresh)
    await persistence.saveGitCache(projectPath, fresh)
    return fresh
  })

  ipcMain.handle('refresh-git', async (_event, projectPath: string): Promise<GitState> => {
    const fresh = await gitService.getGitState(projectPath)
    gitCache.set(projectPath, fresh)
    await persistence.saveGitCache(projectPath, fresh)
    return fresh
  })

  ipcMain.handle(
    'copy-text',
    (_event, text: string): void => {
      copyText(text)
    }
  )

  ipcMain.handle('get-recent', (): Promise<string[]> => persistence.getRecent())

  ipcMain.handle(
    'add-recent',
    (_event, projectPath: string): Promise<void> => persistence.addRecent(projectPath)
  )

  watcher.on('registry-changed', async () => {
    win.webContents.send('registry-changed')
    const entries = await loadAllProjects()
    for (const entry of entries) {
      watcher.addStateWatch(entry.path, getStatePath(entry.path))
    }
  })

  watcher.on('state-changed', (projectPath: string) => {
    win.webContents.send('state-changed', projectPath)
  })
}

export function cleanupIpcHandlers(): void {
  watcher.stop()
  ipcMain.removeAllListeners()
}
