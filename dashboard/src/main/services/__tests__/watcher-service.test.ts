import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WatcherService } from '../watcher-service'

// ── chokidar mock ─────────────────────────────────────────────────────────────

type ChangeHandler = (path: string) => void

function makeMockWatcher() {
  let capturedChangeHandler: ChangeHandler | null = null
  const w = {
    on: vi.fn((event: string, handler: ChangeHandler) => {
      if (event === 'change') capturedChangeHandler = handler
      return w
    }),
    add: vi.fn(),
    unwatch: vi.fn(),
    close: vi.fn(),
    emit: (path: string) => capturedChangeHandler?.(path)
  }
  return w
}

const watchMock = vi.fn()

vi.mock('chokidar', () => ({
  default: { watch: (...args: unknown[]) => watchMock(...args) }
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const REGISTRY = '/home/.agent-c/registry.json'
const STATE_A = '/proj/a/docs/product/state.json'
const STATE_B = '/proj/b/docs/product/state.json'

function statePaths(...pairs: [string, string][]): Map<string, string> {
  return new Map(pairs)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WatcherService', () => {
  let svc: WatcherService
  let mockWatcher: ReturnType<typeof makeMockWatcher>

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatcher = makeMockWatcher()
    watchMock.mockReturnValue(mockWatcher)
    svc = new WatcherService()
  })

  // ── start() ──────────────────────────────────────────────────────────────

  it('calls chokidar.watch with registry + all state paths on first start', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    expect(watchMock).toHaveBeenCalledOnce()
    const [paths] = watchMock.mock.calls[0] as [string[]]
    expect(paths).toContain(REGISTRY)
    expect(paths).toContain(STATE_A)
  })

  it('closes the existing watcher before starting a new one (no leak)', () => {
    const w1 = makeMockWatcher()
    const w2 = makeMockWatcher()
    watchMock.mockReturnValueOnce(w1).mockReturnValueOnce(w2)

    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    expect(w1.close).not.toHaveBeenCalled()

    svc.start(REGISTRY, statePaths(['/proj/b', STATE_B]))
    expect(w1.close).toHaveBeenCalledOnce()
    expect(watchMock).toHaveBeenCalledTimes(2)
  })

  // ── registry-changed event ────────────────────────────────────────────────

  it('emits registry-changed when the registry file changes', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    const listener = vi.fn()
    svc.on('registry-changed', listener)
    mockWatcher.emit(REGISTRY)
    expect(listener).toHaveBeenCalledOnce()
  })

  // ── state-changed event ───────────────────────────────────────────────────

  it('emits state-changed with project path when a state file changes', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    const listener = vi.fn()
    svc.on('state-changed', listener)
    mockWatcher.emit(STATE_A)
    expect(listener).toHaveBeenCalledWith('/proj/a')
  })

  it('does not emit state-changed for an unknown path', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    const listener = vi.fn()
    svc.on('state-changed', listener)
    mockWatcher.emit('/unknown/path')
    expect(listener).not.toHaveBeenCalled()
  })

  // ── addStateWatch ─────────────────────────────────────────────────────────

  it('addStateWatch adds the path to the underlying watcher', () => {
    svc.start(REGISTRY, statePaths())
    svc.addStateWatch('/proj/b', STATE_B)
    expect(mockWatcher.add).toHaveBeenCalledWith(STATE_B)
  })

  it('addStateWatch registers the path so state-changed fires for it', () => {
    svc.start(REGISTRY, statePaths())
    svc.addStateWatch('/proj/b', STATE_B)
    const listener = vi.fn()
    svc.on('state-changed', listener)
    mockWatcher.emit(STATE_B)
    expect(listener).toHaveBeenCalledWith('/proj/b')
  })

  // ── removeStateWatch ──────────────────────────────────────────────────────

  it('removeStateWatch calls unwatch on the underlying watcher', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    svc.removeStateWatch('/proj/a')
    expect(mockWatcher.unwatch).toHaveBeenCalledWith(STATE_A)
  })

  it('removeStateWatch prevents state-changed from firing for that path', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    svc.removeStateWatch('/proj/a')
    const listener = vi.fn()
    svc.on('state-changed', listener)
    mockWatcher.emit(STATE_A)
    expect(listener).not.toHaveBeenCalled()
  })

  // ── getWatchedProjectPaths ────────────────────────────────────────────────

  it('getWatchedProjectPaths returns current project paths', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A], ['/proj/b', STATE_B]))
    expect(svc.getWatchedProjectPaths()).toEqual(new Set(['/proj/a', '/proj/b']))
  })

  it('getWatchedProjectPaths reflects addStateWatch and removeStateWatch', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    svc.addStateWatch('/proj/b', STATE_B)
    svc.removeStateWatch('/proj/a')
    expect(svc.getWatchedProjectPaths()).toEqual(new Set(['/proj/b']))
  })

  // ── stop() ────────────────────────────────────────────────────────────────

  it('stop closes the watcher', () => {
    svc.start(REGISTRY, statePaths(['/proj/a', STATE_A]))
    svc.stop()
    expect(mockWatcher.close).toHaveBeenCalledOnce()
  })
})
