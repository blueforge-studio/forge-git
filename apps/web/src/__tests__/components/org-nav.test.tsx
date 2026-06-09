import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import OrgNav from '@/components/org-nav'

vi.mock('next/navigation', () => ({}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

afterEach(() => {
  cleanup()
})

describe('OrgNav', () => {
  it('renders all four tab links', () => {
    render(<OrgNav orgName="acme" activeTab="overview" />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('links Overview to base org URL', () => {
    render(<OrgNav orgName="acme" activeTab="overview" />)
    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).toHaveAttribute('href', '/organizations/acme')
  })

  it('links sub-tabs to org sub-paths', () => {
    render(<OrgNav orgName="acme" activeTab="overview" />)

    expect(screen.getByText('Teams').closest('a')).toHaveAttribute('href', '/organizations/acme/teams')
    expect(screen.getByText('Members').closest('a')).toHaveAttribute('href', '/organizations/acme/members')
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/organizations/acme/settings')
  })

  it('highlights active tab with primary border', () => {
    const { container } = render(<OrgNav orgName="acme" activeTab="teams" />)

    const teamsLink = screen.getByText('Teams').closest('a')
    const overviewLink = screen.getByText('Overview').closest('a')

    expect(teamsLink?.className).toContain('border-primary')
    expect(overviewLink?.className).not.toContain('border-primary')
  })

  it('treats "overview" as active for Overview tab', () => {
    render(<OrgNav orgName="acme" activeTab="overview" />)
    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink?.className).toContain('border-primary')
  })

  it('highlights settings tab when active', () => {
    render(<OrgNav orgName="acme" activeTab="settings" />)
    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink?.className).toContain('border-primary')
  })
})
