import chokidar, { FSWatcher } from 'chokidar'
import { EventEmitter } from 'events'

export interface WatcherEvents {
  'registry-changed': []
  'state-changed': [projectPath: string]
}

export class WatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null
  private statePaths: Map<string, string> = new Map() // projectPath → state.json path

  getWatchedProjectPaths(): Set<string> {
    return new Set(this.statePaths.keys())
  }

  start(registryPath: string, statePaths: Map<string, string>): void {
    this.watcher?.close()
    this.statePaths = statePaths
    const pathsToWatch = [registryPath, ...Array.from(statePaths.values())]

    this.watcher = chokidar.watch(pathsToWatch, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
    })

    this.watcher.on('change', (changedPath) => {
      if (changedPath === registryPath) {
        this.emit('registry-changed')
        return
      }
      for (const [projectPath, statePath] of this.statePaths) {
        if (changedPath === statePath) {
          this.emit('state-changed', projectPath)
          return
        }
      }
    })
  }

  addStateWatch(projectPath: string, statePath: string): void {
    this.statePaths.set(projectPath, statePath)
    if (this.watcher) {
      this.watcher.add(statePath)
    }
  }

  removeStateWatch(projectPath: string): void {
    const statePath = this.statePaths.get(projectPath)
    if (statePath && this.watcher) {
      this.watcher.unwatch(statePath)
    }
    this.statePaths.delete(projectPath)
  }

  stop(): void {
    this.watcher?.close()
    this.watcher = null
  }
}
