import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import NotificationFilters from '@/components/notification-filters'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => {
  mockPush.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('NotificationFilters', () => {
  it('renders all filter buttons', () => {
    render(<NotificationFilters />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Issues')).toBeInTheDocument()
    expect(screen.getByText('Pull Requests')).toBeInTheDocument()
    expect(screen.getByText('Commits')).toBeInTheDocument()
    expect(screen.getByText('Repositories')).toBeInTheDocument()
  })

  it('highlights All as active by default', () => {
    render(<NotificationFilters />)

    const allBtn = screen.getByText('All').closest('button')
    const issuesBtn = screen.getByText('Issues').closest('button')

    // Active button should have different styling
    expect(allBtn?.className).not.toBe(issuesBtn?.className)
  })

  it('navigates with type param when filter clicked', () => {
    render(<NotificationFilters />)

    fireEvent.click(screen.getByText('Issues'))

    expect(mockPush).toHaveBeenCalledWith('/notifications?type=Issue')
  })

  it('clears type param when All clicked', () => {
    render(<NotificationFilters />)

    fireEvent.click(screen.getByText('All'))

    expect(mockPush).toHaveBeenCalledWith('/notifications?')
  })

  it('navigates with PullRequest type', () => {
    render(<NotificationFilters />)

    fireEvent.click(screen.getByText('Pull Requests'))

    expect(mockPush).toHaveBeenCalledWith('/notifications?type=PullRequest')
  })

  it('navigates with Commit type', () => {
    render(<NotificationFilters />)

    fireEvent.click(screen.getByText('Commits'))

    expect(mockPush).toHaveBeenCalledWith('/notifications?type=Commit')
  })
})
