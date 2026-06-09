import type { Meta, StoryObj } from '@storybook/react'
import RepoCard from '@/components/repo-card'
import type { GiteaRepo } from '@forge-git/gitea-bridge'

const makeRepo = (overrides?: Partial<GiteaRepo>): GiteaRepo => ({
  id: 1,
  name: 'frontend',
  full_name: 'testuser/frontend',
  private: false,
  description: 'React frontend application',
  fork: false,
  template: false,
  size: 1234,
  stars_count: 12,
  forks_count: 3,
  watchers_count: 0,
  open_issues_count: 5,
  open_pr_counter: 2,
  default_branch: 'main',
  archived: false,
  visibility: 'public',
  created_at: '2024-06-15T00:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
  pushed_at: '2025-06-01T10:00:00Z',
  owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
  html_url: 'http://localhost:3000/testuser/frontend',
  clone_url: 'https://localhost:3000/testuser/frontend.git',
  ssh_url: 'git@localhost:testuser/frontend.git',
  language: 'TypeScript',
  ...overrides,
})

const meta: Meta<typeof RepoCard> = {
  title: 'Components/RepoCard',
  component: RepoCard,
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
}

export default meta
type Story = StoryObj<typeof RepoCard>

export const PublicRepo: Story = {
  args: { repo: makeRepo() },
}

export const PrivateRepo: Story = {
  args: { repo: makeRepo({ private: true, name: 'backend', full_name: 'testuser/backend', description: 'Go API server', language: 'Go' }) },
}

export const LongDescription: Story = {
  args: { repo: makeRepo({ description: 'A very long repository description that demonstrates how the card handles wrapping text when the description is longer than a single line in the layout.' }) },
}

export const NoDescription: Story = {
  args: { repo: makeRepo({ description: '' }) },
}

export const Archived: Story = {
  args: { repo: makeRepo({ archived: true, name: 'old-project', full_name: 'testuser/old-project' }) },
}
