import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import BuildJobCard from '@/components/build-job-card'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const activeJob = {
  id: 'abc123',
  state: 'active',
  timestamp: 1700000000000,
  data: { repoId: 'acme/frontend', branch: 'main', commitSha: 'abcdef1234567890' },
}

const failedJob = {
  id: 'def456',
  state: 'failed',
  timestamp: 1700000001000,
  failedReason: 'Build script exited with code 1',
  data: { repoId: 'acme/backend', branch: 'feat/api' },
}

const completedJob = {
  id: 'ghi789',
  state: 'completed',
  timestamp: 1700000002000,
  data: { repoId: 'acme/lib' },
}

const waitingJob = {
  id: 'jkl012',
  state: 'waiting',
  data: { repoId: 'acme/docs' },
}

describe('BuildJobCard', () => {
  it('renders job ID as a link', () => {
    render(<BuildJobCard job={activeJob} />)

    const link = screen.getByText('#abc123')
    expect(link.closest('a')).toHaveAttribute('href', '/builds/abc123')
  })

  it('renders state badge', () => {
    render(<BuildJobCard job={activeJob} />)

    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders repo and branch info', () => {
    render(<BuildJobCard job={activeJob} />)

    expect(screen.getByText('acme/frontend')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
  })

  it('renders truncated commit SHA', () => {
    render(<BuildJobCard job={activeJob} />)

    expect(screen.getByText('abcdef1')).toBeInTheDocument()
  })

  it('renders timestamp in locale format', () => {
    render(<BuildJobCard job={activeJob} />)

    expect(screen.getByText(new Date(1700000000000).toLocaleString())).toBeInTheDocument()
  })

  it('shows Unknown date when timestamp is missing', () => {
    render(<BuildJobCard job={waitingJob} />)

    expect(screen.getByText('Unknown date')).toBeInTheDocument()
  })

  it('shows retry button for failed jobs', () => {
    render(<BuildJobCard job={failedJob} />)

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('shows cancel button for active jobs', () => {
    render(<BuildJobCard job={activeJob} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows cancel button for waiting jobs', () => {
    render(<BuildJobCard job={waitingJob} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('does not show retry on completed jobs', () => {
    render(<BuildJobCard job={completedJob} />)

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('sends PATCH request on retry click', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    render(<BuildJobCard job={failedJob} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/builds/def456', { method: 'PATCH' })
    })
  })

  it('sends DELETE request on cancel click', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    render(<BuildJobCard job={activeJob} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/builds/abc123', { method: 'DELETE' })
    })
  })

  it('shows loading text on retry button while in progress', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<BuildJobCard job={failedJob} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Retrying...' })).toBeInTheDocument()
    })
  })

  it('shows loading text on cancel button while in progress', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<BuildJobCard job={activeJob} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancelling...' })).toBeInTheDocument()
    })
  })

  it('handles missing data fields gracefully', () => {
    const minimalJob = { id: 'min', state: 'completed', data: {} }

    render(<BuildJobCard job={minimalJob} />)

    // "Repo:" label followed by "-" for missing repoId
    const dashElements = screen.getAllByText('-')
    expect(dashElements.length).toBeGreaterThanOrEqual(1)
  })
})
