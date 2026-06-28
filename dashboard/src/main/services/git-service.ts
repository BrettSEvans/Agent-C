import { execFile as nodeExecFile } from 'child_process'
import { promisify } from 'util'
import pLimit from 'p-limit'
import type { GitState, UncommittedFile } from '../../shared/types'

export interface ExecFileResult {
  stdout: string
  stderr: string
}

export type ExecFileFn = (
  file: string,
  args: string[],
  options: { cwd: string }
) => Promise<ExecFileResult>

function statusLabel(code: string): UncommittedFile['label'] {
  if (code === '??') return 'untracked'
  if (code.includes('D')) return 'deleted'
  if (code.includes('A') && !code.includes('M')) return 'added'
  if (code.includes('R')) return 'renamed'
  return 'modified'
}

export function parseStatusFiles(output: string): UncommittedFile[] {
  return output
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const statusCode = line.slice(0, 2)
      const path = line.slice(3)
      return { statusCode, label: statusLabel(statusCode), path }
    })
}

export function parseRevListOutput(output: string): number {
  return output
    .split('\n')
    .filter((line) => line.trim().length > 0).length
}

export function createGitService(execFileFn: ExecFileFn) {
  return {
    async getGitState(projectPath: string): Promise<GitState> {
      const now = new Date().toISOString()

      let uncommittedFiles: UncommittedFile[] = []
      try {
        const { stdout } = await execFileFn('git', ['status', '--porcelain'], {
          cwd: projectPath
        })
        uncommittedFiles = parseStatusFiles(stdout)
      } catch {
        return {
          uncommittedCount: 0,
          uncommittedFiles: [],
          unpushedCount: 0,
          computedAt: now,
          status: 'failed'
        }
      }

      let unpushedCount = 0
      try {
        const { stdout } = await execFileFn('git', ['rev-list', '@{u}..HEAD'], {
          cwd: projectPath
        })
        unpushedCount = parseRevListOutput(stdout)
      } catch {
        unpushedCount = 0
      }

      return {
        uncommittedCount: uncommittedFiles.length,
        uncommittedFiles,
        unpushedCount,
        computedAt: now,
        status: 'fresh'
      }
    }
  }
}

// Production instance: real execFile throttled to cap-6 concurrent git processes
const execFileAsync = promisify(nodeExecFile) as ExecFileFn
const limit = pLimit(6)

export const gitService = createGitService(
  (file, args, options) =>
    limit(async () => {
      const result = await execFileAsync(file, args, options as Parameters<typeof execFileAsync>[2])
      return { stdout: String(result.stdout), stderr: String(result.stderr) }
    })
)
