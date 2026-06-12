import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import Header from '@/components/header'

vi.mock('@/lib/session', () => ({
  getActiveSession: vi.fn(),
}))

vi.mock('@forge-git/gitea-bridge', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@blueforge-studio/app-kit', () => ({
  UserMenu: ({ name, avatar, items }: any) => (
    <div data-testid="user-menu">
      {avatar}
      <span>{name}</span>
      {items?.map((item: any, i: number) => (
        item.divider ? <hr key={i} /> : <a key={i} href={item.href}>{item.label}</a>
      ))}
    </div>
  ),
}))

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

    render(await Header())

    expect(screen.getByText('brandName')).toBeInTheDocument()
  })

  it('shows sign in link when unauthenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue(null)

    render(await Header())

    expect(screen.getByText('signIn')).toBeInTheDocument()
    expect(screen.queryByText('nav.repositories')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.organizations')).not.toBeInTheDocument()
  })

  it('shows nav links when authenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, login: 'octocat', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' })

    render(await Header())

    expect(screen.getByText('nav.repositories')).toBeInTheDocument()
    expect(screen.getByText('nav.organizations')).toBeInTheDocument()
    expect(screen.getByText('nav.builds')).toBeInTheDocument()
    expect(screen.getByText('userMenu.settings')).toBeInTheDocument()
  })

  it('shows username when user data loads', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, login: 'octocat', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' })

    render(await Header())

    expect(screen.getByText('octocat')).toBeInTheDocument()
  })

  it('shows avatar image when user has avatar_url', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, login: 'octocat', avatar_url: 'https://example.com/avatar.png', is_admin: false, created_at: '2024-01-01T00:00:00Z' })

    render(await Header())

    const avatar = screen.getByAltText('octocat')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('shows sign out and theme toggle when authenticated', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, login: 'octocat', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' })

    render(await Header())

    expect(screen.getByText('Sign out')).toBeInTheDocument()
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })

  it('hides user info when getCurrentUser fails', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Token expired'))

    render(await Header())

    // Nav should still render, but no username
    expect(screen.getByText('nav.repositories')).toBeInTheDocument()
    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
  })

  it('has correct repository link href', async () => {
    vi.mocked(getActiveSession).mockResolvedValue({ token: 'tk', baseUrl: 'https://gitea.example.com' })
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 1, login: 'octocat', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' })

    render(await Header())

    expect(screen.getByText('nav.repositories').closest('a')).toHaveAttribute('href', '/repositories')
    expect(screen.getByText('nav.builds').closest('a')).toHaveAttribute('href', '/builds')
  })
})
