import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { dirname } from 'path'
import { RegistrySchema, type Registry } from './schema'

export class RegistryStore {
  readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async read(): Promise<Registry> {
    try {
      const content = await readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(content)
      return RegistrySchema.parse(parsed)
    } catch (error: any) {
      // If file does not exist, return empty registry
      if (error.code === 'ENOENT') {
        return { version: 1, entries: [] }
      }
      throw error
    }
  }

  async write(registry: Registry): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    const content = JSON.stringify(registry, null, 2)
    const tempPath = `${this.filePath}.tmp`

    await writeFile(tempPath, content, 'utf-8')
    await rename(tempPath, this.filePath)
  }
}
