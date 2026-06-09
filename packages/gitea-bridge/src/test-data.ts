import type {
  GiteaRepo, PullRequest, Issue, Release, Branch, Commit,
  GiteaUser, GiteaOrg, OrgMember, Team, Notification,
  TreeEntry, SearchResult,
} from './types'

export const mockUser: GiteaUser = {
  id: 1,
  login: 'testuser',
  full_name: 'Test User',
  email: 'test@forge.git',
  avatar_url: 'https://avatar.example.com/u/1',
  language: 'en',
  is_admin: false,
  last_login: new Date().toISOString(),
  created_at: '2024-06-01T00:00:00Z',
  restricted: false,
}

export const mockRepos: GiteaRepo[] = [
  {
    id: 1, name: 'frontend', full_name: 'testuser/frontend', private: false,
    description: 'React frontend application',
    empty: false, fork: false, mirror: false,
    size: 1234, stars_count: 12, forks_count: 3,
    default_branch: 'main', archived: false,
    created_at: '2024-06-15T00:00:00Z', updated_at: '2025-06-01T10:00:00Z',
    permissions: { admin: true, push: true, pull: true },
    owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
    html_url: 'https://git.localhost:3001/testuser/frontend',
    language: 'TypeScript',
  },
  {
    id: 2, name: 'backend', full_name: 'testuser/backend', private: true,
    description: 'Go API server',
    empty: false, fork: false, mirror: false,
    size: 890, stars_count: 5, forks_count: 1,
    default_branch: 'main', archived: false,
    created_at: '2024-08-01T00:00:00Z', updated_at: '2025-06-05T14:00:00Z',
    permissions: { admin: true, push: true, pull: true },
    owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
    html_url: 'https://git.localhost:3001/testuser/backend',
    language: 'Go',
  },
  {
    id: 3, name: 'lib', full_name: 'testorg/shared-lib', private: false,
    description: 'Shared utility library',
    empty: false, fork: false, mirror: false,
    size: 345, stars_count: 20, forks_count: 7,
    default_branch: 'main', archived: false,
    created_at: '2024-09-01T00:00:00Z', updated_at: '2025-06-08T08:00:00Z',
    permissions: { admin: false, push: true, pull: true },
    owner: { id: 2, login: 'testorg', full_name: 'Test Org', avatar_url: '' },
    html_url: 'https://git.localhost:3001/testorg/shared-lib',
    language: 'Rust',
  },
]

export const mockPulls: PullRequest[] = [
  {
    id: 101, number: 1, title: 'Add user authentication',
    state: 'open', locked: false, mergeable: true,
    created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-08T12:00:00Z',
    body: 'Implements OAuth2 login flow',
    html_url: 'https://git.localhost:3001/testuser/frontend/pulls/1',
    head: { label: 'feat/auth', ref: 'feat/auth', sha: 'abc123', repo: mockRepos[0] },
    base: { label: 'main', ref: 'main', sha: 'def456', repo: mockRepos[0] },
    user: mockUser,
  },
  {
    id: 102, number: 2, title: 'Fix pagination bug',
    state: 'open', locked: false, mergeable: true,
    created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-07T09:00:00Z',
    body: 'Fixes off-by-one in pagination',
    html_url: 'https://git.localhost:3001/testuser/backend/pulls/2',
    head: { label: 'fix/pagination', ref: 'fix/pagination', sha: 'bbb111', repo: mockRepos[1] },
    base: { label: 'main', ref: 'main', sha: 'ccc222', repo: mockRepos[1] },
    user: mockUser,
  },
]

export const mockIssues: Issue[] = [
  {
    id: 201, number: 1, title: 'Dark mode toggle not working',
    state: 'open', created_at: '2025-06-03T00:00:00Z', updated_at: '2025-06-08T15:00:00Z',
    body: 'The dark mode toggle in the header does not persist across page loads.',
    html_url: 'https://git.localhost:3001/testuser/frontend/issues/1',
    user: mockUser,
  },
  {
    id: 202, number: 2, title: 'Add rate limiting to API',
    state: 'open', created_at: '2025-06-06T00:00:00Z', updated_at: '2025-06-07T11:00:00Z',
    body: 'Need to add rate limiting middleware to prevent abuse.',
    html_url: 'https://git.localhost:3001/testuser/backend/issues/2',
    user: mockUser,
  },
  {
    id: 203, number: 3, title: 'Update README with setup instructions',
    state: 'closed', created_at: '2025-05-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    body: 'Document the new env vars.',
    html_url: 'https://git.localhost:3001/testuser/frontend/issues/3',
    user: mockUser,
  },
]

export const mockReleases: Release[] = [
  {
    id: 1, tag_name: 'v1.0.0', name: 'First Release',
    body: 'Initial stable release',
    draft: false, prerelease: false,
    created_at: '2025-06-01T00:00:00Z', published_at: '2025-06-01T00:00:00Z',
    author: mockUser, html_url: '',
  },
]

export const mockBranches: Branch[] = [
  { name: 'main', commit: { id: 'abc123', message: 'Initial commit' } },
  { name: 'feat/auth', commit: { id: 'def456', message: 'Add auth' } },
  { name: 'fix/pagination', commit: { id: 'bbb111', message: 'Fix pagination' } },
]

export const mockCommits: Commit[] = [
  {
    sha: 'abc123', message: 'Initial commit\n\nFull message body',
    html_url: '',
    author: { name: 'Test User', email: 'test@forge.git', date: '2025-06-01T00:00:00Z' },
    committer: { name: 'Test User', email: 'test@forge.git', date: '2025-06-01T00:00:00Z' },
  },
]

export const mockOrgs: GiteaOrg[] = [
  {
    id: 2, name: 'testorg', full_name: 'Test Organization',
    description: 'A test organization for E2E testing',
    visibility: 'public', website: 'https://testorg.example.com',
    avatar_url: '',
  },
]

export const mockMembers: OrgMember[] = [
  { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '', role: 'owner' },
  { id: 2, login: 'collaborator', full_name: 'Collab User', avatar_url: '', role: 'member' },
]

export const mockTeams: Team[] = [
  { id: 1, name: 'developers', description: 'Core developers', permission: 'admin', can_create_org_repo: true },
]

export const mockNotifications: Notification[] = [
  {
    id: 1, unread: true, pinned: false,
    repository: { id: 1, name: 'frontend', full_name: 'testuser/frontend', owner: { login: 'testuser' } },
    subject: { title: 'New PR: Add user authentication', url: '', type: 'PullRequest', state: 'open' },
    updated_at: '2025-06-08T12:00:00Z', created_at: '2025-06-08T12:00:00Z',
  },
  {
    id: 2, unread: false, pinned: false,
    repository: { id: 1, name: 'frontend', full_name: 'testuser/frontend', owner: { login: 'testuser' } },
    subject: { title: 'Dark mode toggle not working', url: '', type: 'Issue', state: 'open' },
    updated_at: '2025-06-08T10:00:00Z', created_at: '2025-06-03T00:00:00Z',
  },
  {
    id: 3, unread: true, pinned: false,
    repository: { id: 2, name: 'backend', full_name: 'testuser/backend', owner: { login: 'testuser' } },
    subject: { title: 'Fix pagination bug', url: '', type: 'PullRequest', state: 'open' },
    updated_at: '2025-06-07T09:00:00Z', created_at: '2025-06-05T00:00:00Z',
  },
]

export const mockTree: TreeEntry[] = [
  { path: 'src', type: 'tree', size: 0, sha: 'tree-src' },
  { path: 'src/index.ts', type: 'blob', size: 256, sha: 'blob-index' },
  { path: 'src/app.tsx', type: 'blob', size: 1024, sha: 'blob-app' },
  { path: 'package.json', type: 'blob', size: 512, sha: 'blob-pkg' },
  { path: 'README.md', type: 'blob', size: 2048, sha: 'blob-readme' },
]

export const mockBlob = {
  content: Buffer.from('import React from "react"\n\nexport default function App() {\n  return <div>Hello Forge Git</div>\n}\n').toString('base64'),
  encoding: 'base64' as const,
  size: 1024,
}

export const mockSearchResults: SearchResult[] = [
  { id: 1, full_name: 'testuser/frontend', description: 'React frontend', stars_count: 12, language: 'TypeScript' },
  { id: 2, full_name: 'testuser/backend', description: 'Go API', stars_count: 5, language: 'Go' },
]
