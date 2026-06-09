import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import Header from '@/components/header'

vi.mock('@/lib/session', () => ({
  getActiveSession: vi.fn(),
}))

vi.mock('@forge-git/gitea-bridge', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/sign-out-button', () => ({
  default: () => <button>Sign out</button>,
}))

vi.mock('@/components/theme-toggle', () => ({
  default: () => <button>Toggle theme</button>,
}))

vi.mock('@/components/notification-bell', () => ({
  default: () => <span>Bell</span>,
}))

vi.mock('@/components/search-bar', () => ({
  default: () => <input placeholder="search mock" />,
}))

const { getActiveSession } = await import('@/lib/session')
const { getCurrentUser } = await import('@forge-git/gitea-bridge')

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('Header', () => {
  it('renders forge-git branding', async () => {
    vi.mocked(getActiveSession).mockResolvedValue(null)

    render(await Header({}))

    expect(screen.getByText('forge-git')).toBeInTheDocument()
  })

  it('shows sign in link when unauthenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue(null)

    render(await Header({}))

    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.queryByText('Repositories')).not.toBeInTheDocument()
    expect(screen.queryByText('Builds')).not.toBeInTheDocument()
  })

  it('shows nav links when authenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ login: 'octocat', avatar_url: '' })

    render(await Header({}))

    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('Builds')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows username when user data loads', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ login: 'octocat', avatar_url: '' })

    render(await Header({}))

    expect(screen.getByText('octocat')).toBeInTheDocument()
  })

  it('shows avatar image when user has avatar_url', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ login: 'octocat', avatar_url: 'https://example.com/avatar.png' })

    render(await Header({}))

    const avatar = screen.getByAltText('octocat')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('shows sign out and theme toggle when authenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ login: 'octocat', avatar_url: '' })

    render(await Header({}))

    expect(screen.getByText('Sign out')).toBeInTheDocument()
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })

  it('hides user info when getCurrentUser fails', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Token expired'))

    render(await Header({}))

    // Nav should still render, but no username
    expect(screen.getByText('Repositories')).toBeInTheDocument()
    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
  })

  it('has correct repository link href', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', giteaUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ login: 'octocat', avatar_url: '' })

    render(await Header({}))

    expect(screen.getByText('Repositories').closest('a')).toHaveAttribute('href', '/repositories')
    expect(screen.getByText('Builds').closest('a')).toHaveAttribute('href', '/builds')
  })
})
