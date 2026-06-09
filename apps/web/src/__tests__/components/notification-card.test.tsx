import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import NotificationCard from '@/components/notification-card'
import type { Notification } from '@forge-git/gitea-bridge'

vi.mock('@/app/notifications/actions', () => ({
  markRead: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const unreadNotification: Notification = {
  id: 1,
  repository: { id: 1, name: 'my-repo', full_name: 'owner/my-repo', owner: { login: 'owner' } },
  subject: { title: 'New issue filed', url: '', type: 'Issue', state: 'open' },
  unread: true,
  pinned: false,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
}

describe('NotificationCard', () => {
  it('renders repo name as a link', () => {
    render(<NotificationCard notification={unreadNotification} />)

    const link = screen.getByRole('link', { name: 'owner/my-repo' })
    expect(link).toHaveAttribute('href', '/repositories/owner/my-repo')
  })

  it('renders subject title', () => {
    render(<NotificationCard notification={unreadNotification} />)

    expect(screen.getByText('New issue filed')).toBeInTheDocument()
  })

  it('renders type badge', () => {
    render(<NotificationCard notification={unreadNotification} />)

    expect(screen.getByText('Issue')).toBeInTheDocument()
  })

  it('shows "Mark read" button when unread', () => {
    render(<NotificationCard notification={unreadNotification} />)

    expect(screen.getByRole('button', { name: 'Mark read' })).toBeInTheDocument()
  })
})
