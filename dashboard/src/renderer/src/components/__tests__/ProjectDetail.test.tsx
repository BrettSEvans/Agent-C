import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { ProjectDetail } from '../ProjectDetail'
import { useDashboardStore } from '../../store'
import type { RegistryEntry, ProjectState, GitState } from '../../../../shared/types'

const entry: RegistryEntry = {
  id: 'tiffany',
  type: 'product',
  name: 'Tiffany',
  path: '/users/me/tiffany',
  slug: null,
  parentId: null,
  productType: 'GUI app',
  currentStage: 'ux',
  status: 'awaiting-approval',
  needsYou: true,
  revisionCount: 2,
  updatedAt: '2026-06-28T00:00:00Z'
}

const state: ProjectState = {
  schemaVersion: 1,
  track: { type: 'product', name: 'Tiffany', slug: null, productType: 'GUI app' },
  currentStage: 'ux',
  stages: {
    pm: { status: 'approved-complete', revisions: 0, criticPasses: 0, checkpoint: null },
    ux: { status: 'awaiting-approval', revisions: 2, criticPasses: 1, checkpoint: null },
    ui: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    architect: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    engineer: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null },
    qa: { status: 'not-started', revisions: 0, criticPasses: 0, checkpoint: null }
  },
  pendingFeedback: null,
  updatedAt: '2026-06-28T00:00:00Z'
}

const stateWithFeedback: ProjectState = {
  ...state,
  pendingFeedback: {
    stage: 'ux',
    source: 'user',
    text: 'Flows section too thin; add resume-project flow.',
    reportPath: null
  }
}

const freshGit: GitState = {
  uncommittedCount: 3,
  uncommittedFiles: [
    { statusCode: ' M', label: 'modified', path: 'src/App.tsx' },
    { statusCode: '??', label: 'untracked', path: 'src/new-file.ts' },
    { statusCode: 'A ', label: 'added', path: 'src/feature.ts' }
  ],
  unpushedCount: 1,
  computedAt: new Date().toISOString(),
  status: 'fresh'
}

describe('ProjectDetail', () => {
  beforeEach(() => {
    act(() => useDashboardStore.getState().reset())
  })

  it('shows the product name prominently', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByRole('heading', { name: /tiffany/i })).toBeInTheDocument()
  })

  it('shows the current stage as a large badge', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByTestId('stage-badge')).toHaveTextContent('UX')
  })

  it('shows the revision count', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByText(/revisions.*2/i)).toBeInTheDocument()
  })

  it('shows the approval warning when status is awaiting-approval', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('approval warning describes a pending revision when pendingFeedback is set', () => {
    render(<ProjectDetail entry={entry} projectState={stateWithFeedback} gitState={freshGit} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/revision requested/i)
  })

  it('approval warning describes ready-for-approval when no pendingFeedback', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/awaiting your approval/i)
  })

  it('does not show the approval warning when status is in-progress', () => {
    const inProgress = { ...entry, status: 'in-progress' as const, needsYou: false }
    render(<ProjectDetail entry={inProgress} projectState={state} gitState={freshGit} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows uncommitted and unpushed counts from git state', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByText(/3 uncommitted/i)).toBeInTheDocument()
    expect(screen.getByText(/1 unpushed/i)).toBeInTheDocument()
  })

  // ── Info button / popup ──────────────────────────────────────────────────

  it('shows the info button when approval is needed', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByRole('button', { name: /show approval details/i })).toBeInTheDocument()
  })

  it('does not show the info button when no approval is needed', () => {
    const inProgress = { ...entry, status: 'in-progress' as const, needsYou: false }
    render(<ProjectDetail entry={inProgress} projectState={state} gitState={freshGit} />)
    expect(screen.queryByRole('button', { name: /show approval details/i })).not.toBeInTheDocument()
  })

  it('clicking info button shows the popup dialog', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /show approval details/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('popup shows revision and critic pass counts', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /show approval details/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/revisions.*2/i)
    expect(screen.getByRole('dialog')).toHaveTextContent(/critic passes.*1/i)
  })

  it('popup shows pending feedback text when pendingFeedback is set', () => {
    render(<ProjectDetail entry={entry} projectState={stateWithFeedback} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /show approval details/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/flows section too thin/i)
  })

  it('closing the popup removes the dialog', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /show approval details/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ── Claude Prompt button ─────────────────────────────────────────────────

  it('shows "Claude Prompt" button', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByRole('button', { name: /copy claude prompt/i })).toBeInTheDocument()
  })

  it('clicking "Claude Prompt" fires the copyText api call', () => {
    const mockApi = { copyText: vi.fn() }
    Object.defineProperty(window, 'api', { value: mockApi, writable: true })
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
    expect(mockApi.copyText).toHaveBeenCalled()
  })

  it('copies /orchestrator prompt when awaiting approval with no pending feedback', () => {
    const mockApi = { copyText: vi.fn() }
    Object.defineProperty(window, 'api', { value: mockApi, writable: true })
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
    expect(mockApi.copyText).toHaveBeenCalledWith(expect.stringMatching(/orchestrator/i))
  })

  it('copies /skill revision prompt when pendingFeedback is set', () => {
    const mockApi = { copyText: vi.fn() }
    Object.defineProperty(window, 'api', { value: mockApi, writable: true })
    render(<ProjectDetail entry={entry} projectState={stateWithFeedback} gitState={freshGit} />)
    fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
    expect(mockApi.copyText).toHaveBeenCalledWith(expect.stringMatching(/revision requested/i))
  })

  it('copies next-stage prompt when approved-complete with no git work', () => {
    const mockApi = { copyText: vi.fn() }
    Object.defineProperty(window, 'api', { value: mockApi, writable: true })
    const approved = { ...entry, status: 'approved-complete' as const, currentStage: 'ux' as const }
    const cleanGit: GitState = { uncommittedCount: 0, uncommittedFiles: [], unpushedCount: 0, computedAt: new Date().toISOString(), status: 'fresh' }
    render(<ProjectDetail entry={approved} projectState={state} gitState={cleanGit} />)
    fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
    expect(mockApi.copyText).toHaveBeenCalledWith(expect.stringMatching(/ui/i))
  })

  describe('copied toast', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('shows a toast after clicking the button', () => {
      render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
      fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/paste into claude desktop/i)
    })

    it('toast disappears after 5 seconds', () => {
      render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
      fireEvent.click(screen.getByRole('button', { name: /copy claude prompt/i }))
      expect(screen.getByRole('status')).toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(5000) })
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('toast is not visible before the button is clicked', () => {
      render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('shows cached git state age when status is cached', () => {
    const cached: GitState = {
      ...freshGit,
      status: 'cached',
      computedAt: new Date(Date.now() - 90_000).toISOString()
    }
    render(<ProjectDetail entry={entry} projectState={state} gitState={cached} />)
    expect(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  it('shows failed state when git state failed', () => {
    const failed: GitState = {
      uncommittedCount: 0,
      uncommittedFiles: [],
      unpushedCount: 0,
      computedAt: new Date().toISOString(),
      status: 'failed'
    }
    render(<ProjectDetail entry={entry} projectState={state} gitState={failed} />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })

  it('lists file paths when there are uncommitted changes', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getByText('src/App.tsx')).toBeInTheDocument()
    expect(screen.getByText('src/new-file.ts')).toBeInTheDocument()
    expect(screen.getByText('src/feature.ts')).toBeInTheDocument()
  })

  it('shows the status label alongside each file', () => {
    render(<ProjectDetail entry={entry} projectState={state} gitState={freshGit} />)
    expect(screen.getAllByText('modified')).toHaveLength(1)
    expect(screen.getByText('untracked')).toBeInTheDocument()
    expect(screen.getByText('added')).toBeInTheDocument()
  })

  it('does not render the file list when uncommittedFiles is empty', () => {
    const cleanGit: GitState = {
      uncommittedCount: 0,
      uncommittedFiles: [],
      unpushedCount: 0,
      computedAt: new Date().toISOString(),
      status: 'fresh'
    }
    render(<ProjectDetail entry={entry} projectState={state} gitState={cleanGit} />)
    expect(screen.queryByRole('list', { name: /uncommitted/i })).not.toBeInTheDocument()
  })
})
