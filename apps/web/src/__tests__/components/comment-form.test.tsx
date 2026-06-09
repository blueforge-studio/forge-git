import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import CommentForm from '@/components/comment-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CommentForm', () => {
  it('renders textarea and submit button', () => {
    render(<CommentForm owner="owner" repo="repo" index={1} />)

    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comment' })).toBeInTheDocument()
  })

  it('shows loading state on submit', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

    render(<CommentForm owner="owner" repo="repo" index={1} />)

    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), {
      target: { value: 'A new comment' },
    })
    fireEvent.submit(screen.getByPlaceholderText('Write a comment...').closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Posting...' })).toBeDisabled()
    })
  })
})
