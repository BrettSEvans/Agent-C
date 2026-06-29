import { readFile, writeFile, mkdir, rename, rm } from 'fs/promises'
import { dirname } from 'path'
import { StateSchema, type ProjectState } from './schema'
import { ZodError } from 'zod'

export class StateStore {
  readonly filePath: string
  private locked: boolean = false

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async read(): Promise<ProjectState> {
    try {
      const content = await readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(content)

      // Normalize: wrap legacy string checkpoints into objects
      if (parsed.stages) {
        for (const stage of Object.values(parsed.stages) as any[]) {
          if (typeof stage.checkpoint === 'string') {
            stage.checkpoint = {
              sectionsCompleted: [],
              currentSection: stage.checkpoint,
              draftPath: undefined,
              notes: undefined
            }
          }
        }
      }

      const validated = StateSchema.parse(parsed)
      return validated
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid state.json: ${error.message}`)
      }
      throw error
    }
  }

  async write(state: ProjectState): Promise<void> {
    // Validate state before writing
    StateSchema.parse(state)

    this.locked = true
    try {
      // Atomic write via temp file + rename
      const tempPath = `${this.filePath}.tmp`
      const content = JSON.stringify(state, null, 2)

      // Ensure directory exists
      await mkdir(dirname(this.filePath), { recursive: true })

      // Write to temp file
      await writeFile(tempPath, content, 'utf-8')

      // Atomic rename (on POSIX systems)
      await rename(tempPath, this.filePath)
    } finally {
      // Release lock
      this.locked = false
      // Clean up temp file if it still exists
      try {
        const tempPath = `${this.filePath}.tmp`
        await rm(tempPath, { force: true })
      } catch (e) {
        // ignore
      }
    }
  }

  isLocked(): boolean {
    return this.locked
  }
}
