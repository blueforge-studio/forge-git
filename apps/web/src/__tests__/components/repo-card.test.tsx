import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import RepoCard from '@/components/repo-card'
import type { GiteaRepo } from '@forge-git/gitea-bridge'

afterEach(() => cleanup())

const baseRepo: GiteaRepo = {
  id: 1,
  name: 'my-repo',
  full_name: 'testuser/my-repo',
  description: 'A test repository',
  private: false,
  fork: false,
  template: false,
  html_url: 'http://localhost:3001/testuser/my-repo',
  ssh_url: 'git@localhost:testuser/my-repo.git',
  clone_url: 'http://localhost:3001/testuser/my-repo.git',
  default_branch: 'main',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  pushed_at: '2024-01-03T00:00:00Z',
  size: 1024,
  language: 'TypeScript',
  open_issues_count: 3,
  open_pr_counter: 1,
  stars_count: 5,
  forks_count: 2,
  watchers_count: 10,
  visibility: 'public',
  archived: false,
}

describe('RepoCard', () => {
  it('renders repo full name as a link', () => {
    render(<RepoCard repo={baseRepo} />)
    const link = screen.getByRole('link', { name: 'testuser/my-repo' })
    expect(link).toHaveAttribute('href', '/repositories/testuser/my-repo')
  })

  it('renders description', () => {
    render(<RepoCard repo={baseRepo} />)
    expect(screen.getByText('A test repository')).toBeInTheDocument()
  })

  it('renders language indicator', () => {
    render(<RepoCard repo={baseRepo} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('shows lock icon for private repos', () => {
    render(<RepoCard repo={{ ...baseRepo, private: true }} />)
    expect(screen.getByRole('link', { name: 'testuser/my-repo' })).toBeInTheDocument()
  })
})
