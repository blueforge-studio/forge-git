export interface GiteaOpts {
  token?: string
  baseUrl?: string
}

function getGiteaUrl(baseUrl?: string): string {
  return baseUrl ?? process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
}
function getGiteaToken(token?: string): string {
  return token ?? process.env.GITEA_TOKEN ?? process.env.FORGE_GIT_TOKEN ?? ''
}

export async function request<T>(path: string, opts?: { init?: RequestInit } & GiteaOpts): Promise<T> {
  const url = `${getGiteaUrl(opts?.baseUrl)}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGiteaToken(opts?.token)}`,
      ...opts?.init?.headers,
    },
    ...opts?.init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gitea API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface GiteaUser {
  id: number
  login: string
  full_name?: string
  email?: string
  avatar_url: string
  language?: string
  is_admin: boolean
  created_at: string
  last_login?: string
}

export interface GiteaOrg {
  id: number
  name: string
  full_name: string
  description?: string
  website: string
  location: string
  visibility: 'public' | 'limited' | 'private'
  repo_admin_change_team_access: boolean
  avatar_url: string
  created_at: string
}

export interface CreateOrgRequest {
  name: string
  full_name?: string
  description?: string
  website?: string
  location?: string
  visibility?: 'public' | 'limited' | 'private'
}

export interface GiteaRepo {
  id: number
  name: string
  full_name: string
  description?: string
  private: boolean
  fork: boolean
  template: boolean
  html_url: string
  ssh_url: string
  clone_url: string
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  language?: string
  open_issues_count: number
  open_pr_counter: number
  stars_count: number
  forks_count: number
  watchers_count: number
  visibility: string
  archived: boolean
}

export interface CreateRepoRequest {
  name: string
  description?: string
  private?: boolean
  auto_init?: boolean
  default_branch?: string
  gitignore_template?: string
  license?: string
  readme?: string
}

export interface RepoKey {
  id: number
  key: string
  title: string
  fingerprint: string
  created_at: string
  read_only: boolean
}

export interface Webhook {
  id: number
  type: string
  config: {
    url: string
    content_type: string
    secret: string
    http_method: string
  }
  events: string[]
  active: boolean
  created_at: string
}

export interface BranchProtection {
  rule_name: string
  branch_name: string
  enable_push: boolean
  enable_push_whitelist: boolean
  push_whitelist_usernames?: string[]
  enable_merge_whitelist: boolean
  merge_whitelist_usernames?: string[]
  enable_status_check: boolean
  status_check_contexts?: string[]
  require_pull_request: boolean
  dismiss_stale_approvals: boolean
}

export interface OrgMember {
  id: number
  login: string
  full_name?: string
  email?: string
  avatar_url: string
}

export interface Team {
  id: number
  name: string
  description?: string
  permission: 'read' | 'write' | 'admin'
  can_create_org_repo: boolean
  includes_all_repositories: boolean
  updated_at: string
  created_at: string
}

export interface ForgeGitOrg {
  giteaId: number
  name: string
  displayName: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
}

export interface ForgeGitMember {
  orgId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
}

export interface ForgeGitWorkflow {
  id: string
  orgId: number
  repoId: number
  name: string
  yaml: string
  enabled: boolean
}

export interface ForgeGitPreview {
  id: string
  orgId: number
  repoId: number
  prNumber: number
  commitSha: string
  url: string
  status: 'pending' | 'building' | 'deployed' | 'failed' | 'archived'
  createdAt: Date
}

export interface PullRequest {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  merged: boolean
  mergeable: boolean
  comments: number
  html_url: string
  diff_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  merged_at?: string
  merge_commit_sha?: string
  head: { label: string; ref: string; sha: string; repo_id: number }
  base: { label: string; ref: string; sha: string; repo_id: number }
}

export interface Issue {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  comments: number
  html_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  labels: Array<{ id: number; name: string; color: string }>
}

export interface Release {
  id: number
  tag_name: string
  name: string
  body?: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at?: string
  html_url: string
  zipball_url: string
  tarball_url: string
}

export interface Branch {
  name: string
  commit: { id: string; message: string }
  protected: boolean
}

export interface Commit {
  sha: string
  commit: {
    author: { name: string; email: string; date: string }
    committer: { name: string; email: string; date: string }
    message: string
  }
  html_url: string
}

export interface SearchResult<T> {
  ok: boolean
  data: T[]
}

export interface Notification {
  id: number
  repository: { id: number; name: string; full_name: string; owner: { login: string } }
  subject: { title: string; url: string; type: string; state: string }
  unread: boolean
  pinned: boolean
  updated_at: string
  created_at: string
}

export interface NotificationCount {
  new: number
}
