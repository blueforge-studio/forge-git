import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import TeamRepoManager from '@/components/team-repo-manager'
import type { GiteaRepo } from '@forge-git/gitea-bridge'

vi.mock('next/navigation', () => ({}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/app/organizations/[name]/teams/[id]/actions', () => ({
  addTeamRepoAction: vi.fn(),
  removeTeamRepoAction: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const mockRepos: GiteaRepo[] = [
  {
    id: 1,
    name: 'frontend',
    full_name: 'acme/frontend',
    description: 'UI app',
    private: false,
    fork: false,
    empty: false,
    archived: false,
    mirror: false,
    owner: { id: 1, login: 'acme', avatar_url: '', full_name: 'Acme' },
    html_url: '',
    ssh_url: '',
    clone_url: '',
    website: '',
    stars_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    default_branch: 'main',
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    name: 'backend',
    full_name: 'acme/backend',
    description: '',
    private: true,
    fork: false,
    empty: false,
    archived: false,
    mirror: false,
    owner: { id: 1, login: 'acme', avatar_url: '', full_name: 'Acme' },
    html_url: '',
    ssh_url: '',
    clone_url: '',
    website: '',
    stars_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    default_branch: 'main',
    created_at: '',
    updated_at: '',
  },
]

describe('TeamRepoManager', () => {
  it('renders heading', () => {
    render(<TeamRepoManager teamId={1} orgName="acme" repos={[]} />)
    expect(screen.getByText('Manage Repositories')).toBeInTheDocument()
  })

  it('shows empty state when no repos assigned', () => {
    render(<TeamRepoManager teamId={1} orgName="acme" repos={[]} />)

    expect(screen.getByText('No repositories assigned to this team.')).toBeInTheDocument()
  })

  it('renders repo list with links and remove buttons', () => {
    render(<TeamRepoManager teamId={1} orgName="acme" repos={mockRepos} />)

    expect(screen.getByText('acme/frontend')).toBeInTheDocument()
    expect(screen.getByText('acme/backend')).toBeInTheDocument()

    const frontendLink = screen.getByText('acme/frontend').closest('a')
    expect(frontendLink).toHaveAttribute('href', '/repositories/acme/frontend')

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    expect(removeButtons).toHaveLength(2)
  })

  it('renders add repository form', () => {
    render(<TeamRepoManager teamId={1} orgName="acme" repos={[]} />)

    expect(screen.getByText('Add Repository')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Repository name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('has hidden inputs with correct values', () => {
    render(<TeamRepoManager teamId={42} orgName="acme" repos={mockRepos} />)

    const teamIdInputs = document.querySelectorAll('input[name="teamId"]')
    const orgInputs = document.querySelectorAll('input[name="org"]')

    // Should have hidden inputs for each remove form + the add form
    expect(teamIdInputs.length).toBeGreaterThanOrEqual(3)
    expect((teamIdInputs[0] as HTMLInputElement).value).toBe('42')
    expect((orgInputs[0] as HTMLInputElement).value).toBe('acme')
  })

  it('has remove forms with repo name hidden inputs', () => {
    render(<TeamRepoManager teamId={1} orgName="acme" repos={mockRepos} />)

    const repoNameInputs = document.querySelectorAll('input[name="repoName"]')
    expect((repoNameInputs[0] as HTMLInputElement).value).toBe('frontend')
    expect((repoNameInputs[1] as HTMLInputElement).value).toBe('backend')
  })
})
