import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExecFileResult } from '../git-service'

vi.mock('../git-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../git-service')>()
  return actual
})

import { parseStatusFiles, parseRevListOutput, createGitService } from '../git-service'

describe('parseStatusFiles', () => {
  it('returns empty array for empty output (clean tree)', () => {
    expect(parseStatusFiles('')).toEqual([])
  })

  it('ignores blank lines', () => {
    expect(parseStatusFiles('\n\n')).toEqual([])
  })

  it('parses a modified working-tree file ( M)', () => {
    const files = parseStatusFiles(' M src/foo.ts\n')
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src/foo.ts')
    expect(files[0].label).toBe('modified')
    expect(files[0].statusCode).toBe(' M')
  })

  it('parses a staged modified file (M )', () => {
    const files = parseStatusFiles('M  src/foo.ts\n')
    expect(files[0].label).toBe('modified')
  })

  it('parses an untracked file (??)', () => {
    const files = parseStatusFiles('?? src/bar.ts\n')
    expect(files[0].label).toBe('untracked')
    expect(files[0].path).toBe('src/bar.ts')
  })

  it('parses an added file (A )', () => {
    const files = parseStatusFiles('A  src/new.ts\n')
    expect(files[0].label).toBe('added')
  })

  it('parses a deleted file (D )', () => {
    const files = parseStatusFiles('D  src/old.ts\n')
    expect(files[0].label).toBe('deleted')
  })

  it('parses multiple files in one output', () => {
    const output = ' M src/foo.ts\n?? src/bar.ts\nA  src/baz.ts\n'
    const files = parseStatusFiles(output)
    expect(files).toHaveLength(3)
    expect(files.map((f) => f.path)).toEqual(['src/foo.ts', 'src/bar.ts', 'src/baz.ts'])
  })
})

describe('parseRevListOutput', () => {
  it('returns 0 for empty output', () => {
    expect(parseRevListOutput('')).toBe(0)
  })

  it('counts lines as commits', () => {
    const output = 'abc123\ndef456\n'
    expect(parseRevListOutput(output)).toBe(2)
  })

  it('ignores trailing newline', () => {
    expect(parseRevListOutput('abc123\n')).toBe(1)
  })
})

describe('createGitService', () => {
  const mockExecFile = vi.fn<() => Promise<ExecFileResult>>()

  beforeEach(() => {
    mockExecFile.mockReset()
  })

  it('returns fresh git state with file list when both commands succeed', async () => {
    mockExecFile
      .mockResolvedValueOnce({ stdout: ' M foo.ts\n?? bar.ts\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'abc\ndef\n', stderr: '' })

    const svc = createGitService(mockExecFile)
    const state = await svc.getGitState('/some/path')

    expect(state.status).toBe('fresh')
    expect(state.uncommittedCount).toBe(2)
    expect(state.uncommittedFiles).toHaveLength(2)
    expect(state.uncommittedFiles[0].path).toBe('foo.ts')
    expect(state.uncommittedFiles[0].label).toBe('modified')
    expect(state.uncommittedFiles[1].label).toBe('untracked')
    expect(state.unpushedCount).toBe(2)
  })

  it('returns empty file list on clean tree', async () => {
    mockExecFile
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })

    const svc = createGitService(mockExecFile)
    const state = await svc.getGitState('/some/path')

    expect(state.uncommittedFiles).toEqual([])
    expect(state.uncommittedCount).toBe(0)
  })

  it('returns unpushedCount 0 when rev-list fails (no upstream)', async () => {
    mockExecFile
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockRejectedValueOnce(new Error('fatal: no upstream'))

    const svc = createGitService(mockExecFile)
    const state = await svc.getGitState('/some/path')

    expect(state.status).toBe('fresh')
    expect(state.uncommittedCount).toBe(0)
    expect(state.unpushedCount).toBe(0)
  })

  it('returns failed status when git status itself fails', async () => {
    mockExecFile.mockRejectedValueOnce(new Error('git not found'))

    const svc = createGitService(mockExecFile)
    const state = await svc.getGitState('/no/such/path')

    expect(state.status).toBe('failed')
    expect(state.uncommittedCount).toBe(0)
    expect(state.uncommittedFiles).toEqual([])
  })
})
