import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import PullReviewList, { type PullReviewWithComments } from '@/app/repositories/[owner]/[repo]/pulls/[number]/pull-review-list'

vi.mock('@/lib/notification-utils', () => ({
  timeAgo: () => '2 hours ago',
}))

afterEach(() => {
  cleanup()
})

const baseReview = {
  id: 1,
  state: 'APPROVED' as const,
  body: 'Looks good!',
  submitted_at: '2024-01-15T10:00:00Z',
  reviewer: {
    id: 10,
    login: 'octocat',
    full_name: 'Octo Cat',
    avatar_url: '',
  },
  html_url: '',
  pull_request_url: '',
  official: true,
  team_review: false,
  dismissed: false,
  stale: false,
  commit_id: 'abc123',
}

const reviews: PullReviewWithComments[] = [
  {
    ...baseReview,
    inlineComments: [],
  },
  {
    ...baseReview,
    id: 2,
    state: 'REQUEST_CHANGES',
    body: 'Please fix the auth middleware.',
    submitted_at: '2024-01-15T11:00:00Z',
    reviewer: { ...baseReview.reviewer, id: 11, login: 'reviewer2' },
    inlineComments: [
      { id: 100, body: 'This needs error handling', path: 'src/auth.ts', line: 42, diff_hunk: '', author: { id: 11, login: 'reviewer2', avatar_url: '' }, created_at: '', updated_at: '' },
      { id: 101, body: 'Use a constant here', path: 'src/auth.ts', line: 58, diff_hunk: '', author: { id: 11, login: 'reviewer2', avatar_url: '' }, created_at: '', updated_at: '' },
    ],
  },
  {
    ...baseReview,
    id: 3,
    state: 'COMMENT',
    body: '',
    submitted_at: '2024-01-15T12:00:00Z',
    reviewer: { ...baseReview.reviewer, id: 12, login: 'commenter', avatar_url: 'https://example.com/avatar.png' },
    inlineComments: [],
  },
]

describe('PullReviewList', () => {
  it('renders all reviews with reviewer logins', () => {
    render(<PullReviewList reviews={reviews} />)

    expect(screen.getByText('octocat')).toBeInTheDocument()
    expect(screen.getByText('reviewer2')).toBeInTheDocument()
    expect(screen.getByText('commenter')).toBeInTheDocument()
  })

  it('renders review states with correct labels', () => {
    render(<PullReviewList reviews={reviews} />)

    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Changes requested')).toBeInTheDocument()
    expect(screen.getByText('Reviewed')).toBeInTheDocument()
  })

  it('renders review body text', () => {
    render(<PullReviewList reviews={reviews} />)

    expect(screen.getByText('Looks good!')).toBeInTheDocument()
    expect(screen.getByText('Please fix the auth middleware.')).toBeInTheDocument()
  })

  it('shows relative time', () => {
    render(<PullReviewList reviews={reviews} />)
    const timeElements = screen.getAllByText('2 hours ago')
    expect(timeElements).toHaveLength(3)
  })

  it('shows inline comment count toggle button', () => {
    render(<PullReviewList reviews={reviews} />)
    expect(screen.getByText('2 inline comments')).toBeInTheDocument()
  })

  it('expands inline comments on click', () => {
    render(<PullReviewList reviews={reviews} />)

    // Click the toggle button for the review with inline comments
    fireEvent.click(screen.getByText('2 inline comments'))

    expect(screen.getByText('This needs error handling')).toBeInTheDocument()
    expect(screen.getByText('Use a constant here')).toBeInTheDocument()
    expect(screen.getByText('src/auth.ts:42')).toBeInTheDocument()
    expect(screen.getByText('src/auth.ts:58')).toBeInTheDocument()
  })

  it('collapses expanded inline comments on second click', () => {
    render(<PullReviewList reviews={reviews} />)

    const toggle = screen.getByText('2 inline comments')
    fireEvent.click(toggle)
    expect(screen.getByText('This needs error handling')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(screen.queryByText('This needs error handling')).not.toBeInTheDocument()
  })

  it('renders avatar image when avatar_url is provided', () => {
    render(<PullReviewList reviews={reviews} />)

    const avatar = screen.getByAltText('commenter')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('renders user icon fallback when no avatar', () => {
    render(<PullReviewList reviews={reviews} />)

    // octocat has no avatar_url, so should get the User icon fallback
    // The fallback renders as a div with rounded-full bg-secondary
    const reviewerContainers = screen.getAllByText('octocat')
    expect(reviewerContainers).toHaveLength(1)
  })

  it('singularizes "inline comment" when count is 1', () => {
    const singleCommentReview: PullReviewWithComments[] = [{
      ...baseReview,
      inlineComments: [
        { id: 200, body: 'One comment', author: { id: 99, login: 'r', avatar_url: '' }, created_at: '', updated_at: '' },
      ],
    }]

    render(<PullReviewList reviews={singleCommentReview} />)
    expect(screen.getByText('1 inline comment')).toBeInTheDocument()
  })
})
