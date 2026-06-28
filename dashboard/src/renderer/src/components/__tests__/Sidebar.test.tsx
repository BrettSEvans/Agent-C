import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { Sidebar } from '../Sidebar'
import { useDashboardStore } from '../../store'
import type { RegistryEntry } from '../../../../shared/types'

const makeEntry = (overrides: Partial<RegistryEntry> = {}): RegistryEntry => ({
  id: 'proj',
  type: 'product',
  name: 'Proj',
  path: '/users/me/proj',
  slug: null,
  parentId: null,
  productType: 'GUI app',
  currentStage: 'pm',
  status: 'in-progress',
  needsYou: false,
  revisionCount: 0,
  updatedAt: '2026-06-28T00:00:00Z',
  ...overrides
})

describe('Sidebar', () => {
  let onSelect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSelect = vi.fn()
    act(() => useDashboardStore.getState().reset())
  })

  it('renders the search input', () => {
    render(<Sidebar onSelect={onSelect} />)
    expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
  })

  it('renders project names from the store', () => {
    act(() =>
      useDashboardStore.getState().setProjects([
        makeEntry({ id: '1', name: 'Tiffany', path: '/a' }),
        makeEntry({ id: '2', name: 'SecureFile', path: '/b' })
      ])
    )
    render(<Sidebar onSelect={onSelect} />)
    expect(screen.getByText('Tiffany')).toBeInTheDocument()
    expect(screen.getByText('SecureFile')).toBeInTheDocument()
  })

  it('shows approval flag for needsYou projects', () => {
    act(() =>
      useDashboardStore.getState().setProjects([
        makeEntry({ id: '1', name: 'Urgent', path: '/a', needsYou: true })
      ])
    )
    render(<Sidebar onSelect={onSelect} />)
    expect(screen.getByTitle(/approval needed/i)).toBeInTheDocument()
  })

  it('clicking a project calls onSelect with the path', () => {
    act(() =>
      useDashboardStore.getState().setProjects([makeEntry({ id: '1', name: 'Tiffany', path: '/a' })])
    )
    render(<Sidebar onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Tiffany'))
    expect(onSelect).toHaveBeenCalledWith('/a')
  })

  it('search input filters the displayed projects', () => {
    act(() =>
      useDashboardStore.getState().setProjects([
        makeEntry({ id: '1', name: 'Tiffany', path: '/a' }),
        makeEntry({ id: '2', name: 'SecureFile', path: '/b' })
      ])
    )
    render(<Sidebar onSelect={onSelect} />)
    fireEvent.change(screen.getByPlaceholderText(/search projects/i), {
      target: { value: 'tiff' }
    })
    expect(screen.getByText('Tiffany')).toBeInTheDocument()
    expect(screen.queryByText('SecureFile')).not.toBeInTheDocument()
  })

  it('shows "Recently opened" section when recentPaths is populated', () => {
    act(() => {
      useDashboardStore.getState().setProjects([makeEntry({ name: 'Proj', path: '/p' })])
      useDashboardStore.getState().setRecent(['/p'])
    })
    render(<Sidebar onSelect={onSelect} />)
    expect(screen.getByText(/recently opened/i)).toBeInTheDocument()
  })

  it('does not show "Recently opened" section when recentPaths is empty', () => {
    render(<Sidebar onSelect={onSelect} />)
    expect(screen.queryByText(/recently opened/i)).not.toBeInTheDocument()
  })
})
