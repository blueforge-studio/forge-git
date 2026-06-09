import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CommentList from '@/components/comment-list'
import type { Comment } from '@forge-git/gitea-bridge'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const mockComments: Comment[] = [
  {
    id: 1,
    body: 'Great work on this PR!',
    html_url: '',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user: { id: 1, login: 'octocat', full_name: 'Octo Cat', avatar_url: '' },
  },
  {
    id: 2,
    body: 'Looks good to me.',
    html_url: '',
    created_at: '2024-01-16T14:00:00Z',
    updated_at: '2024-01-16T14:00:00Z',
    user: { id: 2, login: 'botuser', avatar_url: '' },
  },
]

describe('CommentList', () => {
  it('renders comments with author names and bodies', () => {
    render(<CommentList comments={mockComments} owner="acme" repo="repo" />)

    expect(screen.getByText('Octo Cat')).toBeInTheDocument()
    expect(screen.getByText('botuser')).toBeInTheDocument()
    expect(screen.getByText('Great work on this PR!')).toBeInTheDocument()
    expect(screen.getByText('Looks good to me.')).toBeInTheDocument()
  })

  it('renders empty state when no comments', () => {
    render(<CommentList comments={[]} owner="acme" repo="repo" />)

    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })
})
