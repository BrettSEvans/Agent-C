import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { GitState } from '../../shared/types'

const RECENT_MAX = 10
const RECENT_FILE = 'recent.json'
const GIT_CACHE_FILE = 'git-cache.json'

interface PersistenceData {
  recent: string[]
  gitCache: Record<string, GitState>
}

export function createPersistence(userDataDir: string) {
  const recentPath = join(userDataDir, RECENT_FILE)
  const gitCachePath = join(userDataDir, GIT_CACHE_FILE)

  async function readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const raw = await readFile(filePath, 'utf-8')
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  async function writeJson(filePath: string, data: unknown): Promise<void> {
    await mkdir(userDataDir, { recursive: true })
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  return {
    async getRecent(): Promise<string[]> {
      return readJson<string[]>(recentPath, [])
    },

    async addRecent(path: string): Promise<void> {
      const current = await readJson<string[]>(recentPath, [])
      const deduped = [path, ...current.filter((p) => p !== path)]
      await writeJson(recentPath, deduped.slice(0, RECENT_MAX))
    },

    async getGitCache(path: string): Promise<GitState | null> {
      const cache = await readJson<Record<string, GitState>>(gitCachePath, {})
      return cache[path] ?? null
    },

    async saveGitCache(path: string, state: GitState): Promise<void> {
      const cache = await readJson<Record<string, GitState>>(gitCachePath, {})
      cache[path] = state
      await writeJson(gitCachePath, cache)
    }
  }
}

export type PersistenceService = ReturnType<typeof createPersistence>
