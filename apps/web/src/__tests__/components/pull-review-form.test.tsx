import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import PullReviewForm from '@/components/pull-review-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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

describe('PullReviewForm', () => {
  it('renders event selector with three options', () => {
    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    expect(screen.getByText('Comment')).toBeInTheDocument()
    expect(screen.getByText('Approve')).toBeInTheDocument()
    expect(screen.getByText('Request Changes')).toBeInTheDocument()
  })

  it('renders body textarea', () => {
    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    expect(screen.getByPlaceholderText('Review summary (optional)')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument()
  })

  it('submits review with selected event and body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    fireEvent.change(screen.getByPlaceholderText('Review summary (optional)'), {
      target: { value: 'LGTM!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/repos/acme/repo/pulls/42/reviews',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'COMMENT', body: 'LGTM!' }),
        })
      )
    })
  })

  it('shows loading state while submitting', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument()
    })
  })

  it('shows error on failed submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Already reviewed' }),
    })

    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => {
      expect(screen.getByText('Already reviewed')).toBeInTheDocument()
    })
  })

  it('calls correct API endpoint on submit', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    render(<PullReviewForm owner="acme" repo="repo" prNumber={42} />)

    fireEvent.change(screen.getByPlaceholderText('Review summary (optional)'), {
      target: { value: 'Ship it' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/repos/acme/repo/pulls/42/reviews',
        expect.objectContaining({
          body: JSON.stringify({ event: 'COMMENT', body: 'Ship it' }),
        })
      )
    })
  })
})
