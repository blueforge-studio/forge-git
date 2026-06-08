/**
 * @forge-git/gitea-bridge
 *
 * Typed client for the Gitea API.
 * Wraps the Gitea REST API with strong types + error handling.
 *
 * Gitea API docs: https://docs.gitea.com/api/1.21/overview
 */

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

async function request<T>(path: string, opts?: { init?: RequestInit } & GiteaOpts): Promise<T> {
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

// ─── User ───────────────────────────────────────────────────────────────────

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

export async function getCurrentUser(opts?: GiteaOpts): Promise<GiteaUser> {
  return request<GiteaUser>('/user', opts)
}

export async function getUser(username: string, opts?: GiteaOpts): Promise<GiteaUser> {
  return request<GiteaUser>(`/users/${username}`, opts)
}

export async function updateCurrentUser(
  data: { full_name?: string; email?: string; location?: string; website?: string; description?: string },
  opts?: GiteaOpts
): Promise<GiteaUser> {
  return request<GiteaUser>('/user', {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}

// ─── Organizations ─────────────────────────────────────────────────────────

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

export async function listOrgs(opts?: GiteaOpts): Promise<GiteaOrg[]> {
  return request<GiteaOrg[]>('/user/orgs', opts)
}

export async function getOrg(orgName: string, opts?: GiteaOpts): Promise<GiteaOrg> {
  return request<GiteaOrg>(`/orgs/${orgName}`, opts)
}

export async function createOrg(data: CreateOrgRequest, opts?: GiteaOpts): Promise<GiteaOrg> {
  return request<GiteaOrg>('/orgs', {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

// ─── Repositories ────────────────────────────────────────────────────────────

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

export async function listUserRepos(username: string, opts?: GiteaOpts): Promise<GiteaRepo[]> {
  return request<GiteaRepo[]>(`/users/${username}/repos`, opts)
}

export async function listOrgRepos(org: string, opts?: GiteaOpts): Promise<GiteaRepo[]> {
  return request<GiteaRepo[]>(`/orgs/${org}/repos`, opts)
}

export async function getRepo(owner: string, repo: string, opts?: GiteaOpts): Promise<GiteaRepo> {
  return request<GiteaRepo>(`/repos/${owner}/${repo}`, opts)
}

export async function createRepo(data: CreateRepoRequest, opts?: GiteaOpts): Promise<GiteaRepo> {
  return request<GiteaRepo>('/user/repos', {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

export async function createOrgRepo(org: string, data: CreateRepoRequest, opts?: GiteaOpts): Promise<GiteaRepo> {
  return request<GiteaRepo>(`/orgs/${org}/repos`, {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

export async function deleteRepo(owner: string, repo: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

// ─── Repository Keys (Deploy Keys) ───────────────────────────────────────────

export interface RepoKey {
  id: number
  key: string
  title: string
  fingerprint: string
  created_at: string
  read_only: boolean
}

export async function listRepoKeys(owner: string, repo: string, opts?: GiteaOpts): Promise<RepoKey[]> {
  return request<RepoKey[]>(`/repos/${owner}/${repo}/keys`, opts)
}

export async function addRepoKey(owner: string, repo: string, data: { title: string; key: string; read_only?: boolean }, opts?: GiteaOpts): Promise<RepoKey> {
  return request<RepoKey>(`/repos/${owner}/${repo}/keys`, {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

export async function deleteRepoKey(owner: string, repo: string, keyId: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/keys/${keyId}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

// ─── Webhooks ───────────────────────────────────────────────────────────────

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

export async function listWebhooks(owner: string, repo: string, opts?: GiteaOpts): Promise<Webhook[]> {
  return request<Webhook[]>(`/repos/${owner}/${repo}/hooks`, opts)
}

export async function createWebhook(owner: string, repo: string, data: {
  type: string
  config: { url: string; content_type: string; secret?: string }
  events?: string[]
  active?: boolean
}, opts?: GiteaOpts): Promise<Webhook> {
  return request<Webhook>(`/repos/${owner}/${repo}/hooks`, {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

export async function deleteWebhook(owner: string, repo: string, hookId: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/hooks/${hookId}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

// ─── Branch Protection ───────────────────────────────────────────────────────

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

export async function getBranchProtection(owner: string, repo: string, branch: string, opts?: GiteaOpts): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`, opts)
}

export async function setBranchProtection(owner: string, repo: string, branch: string, data: BranchProtection, opts?: GiteaOpts): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`, {
    init: {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

// ─── Organization Members ────────────────────────────────────────────────────

export interface OrgMember {
  id: number
  login: string
  full_name?: string
  email?: string
  avatar_url: string
}

export async function listOrgMembers(org: string, opts?: GiteaOpts): Promise<OrgMember[]> {
  return request<OrgMember[]>(`/orgs/${org}/members`, opts)
}

export async function addOrgMember(org: string, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, {
    init: { method: 'PUT' },
    ...opts,
  })
}

export async function removeOrgMember(org: string, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

// ─── Organization Teams ──────────────────────────────────────────────────────

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

export async function listOrgTeams(org: string, opts?: GiteaOpts): Promise<Team[]> {
  return request<Team[]>(`/orgs/${org}/teams`, opts)
}

export async function createTeam(org: string, data: {
  name: string
  description?: string
  permission?: 'read' | 'write' | 'admin'
  repo_names?: string[]
}, opts?: GiteaOpts): Promise<Team> {
  return request<Team>(`/orgs/${org}/teams`, {
    init: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    ...opts,
  })
}

// ─── forge-git extensions ────────────────────────────────────────────────────
// These wrap Gitea primitives with forge-git-specific logic.

export interface ForgeGitOrg {
  giteaId: number
  name: string        // e.g. "acme-corp"
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

// ─── Pull Requests ────────────────────────────────────────────────────────────

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

export async function listPullRequests(
  owner: string, repo: string,
  opts?: { state?: 'open' | 'closed' | 'all' } & GiteaOpts
): Promise<PullRequest[]> {
  const qs = opts?.state && opts.state !== 'all' ? `?state=${opts.state}` : ''
  return request<PullRequest[]>(`/repos/${owner}/${repo}/pulls${qs}`, opts)
}

export async function getPullRequest(
  owner: string, repo: string, index: number, opts?: GiteaOpts
): Promise<PullRequest> {
  return request<PullRequest>(`/repos/${owner}/${repo}/pulls/${index}`, opts)
}

export async function createPullRequest(
  owner: string, repo: string,
  data: { title: string; head: string; base: string; body?: string },
  opts?: GiteaOpts
): Promise<PullRequest> {
  return request<PullRequest>(`/repos/${owner}/${repo}/pulls`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function updatePullRequest(
  owner: string, repo: string, index: number,
  data: { title?: string; body?: string; state?: 'open' | 'closed' },
  opts?: GiteaOpts
): Promise<PullRequest> {
  return request<PullRequest>(`/repos/${owner}/${repo}/pulls/${index}`, {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function mergePullRequest(
  owner: string, repo: string, index: number,
  opts?: GiteaOpts
): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/pulls/${index}/merge`, {
    init: { method: 'POST' },
    ...opts,
  })
}

// ─── Issues ───────────────────────────────────────────────────────────────────

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

export async function listIssues(
  owner: string, repo: string,
  opts?: { state?: 'open' | 'closed' | 'all' } & GiteaOpts
): Promise<Issue[]> {
  const qs = opts?.state && opts.state !== 'all' ? `?state=${opts.state}` : ''
  return request<Issue[]>(`/repos/${owner}/${repo}/issues${qs}`, opts)
}

export async function getIssue(
  owner: string, repo: string, index: number, opts?: GiteaOpts
): Promise<Issue> {
  return request<Issue>(`/repos/${owner}/${repo}/issues/${index}`, opts)
}

export async function createIssue(
  owner: string, repo: string,
  data: { title: string; body?: string; labels?: number[] },
  opts?: GiteaOpts
): Promise<Issue> {
  return request<Issue>(`/repos/${owner}/${repo}/issues`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function updateIssue(
  owner: string, repo: string, index: number,
  data: { title?: string; body?: string; state?: 'open' | 'closed' },
  opts?: GiteaOpts
): Promise<Issue> {
  return request<Issue>(`/repos/${owner}/${repo}/issues/${index}`, {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}

// ─── Releases ─────────────────────────────────────────────────────────────────

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

export async function listReleases(
  owner: string, repo: string, opts?: GiteaOpts
): Promise<Release[]> {
  return request<Release[]>(`/repos/${owner}/${repo}/releases`, opts)
}

export async function getRelease(
  owner: string, repo: string, id: number, opts?: GiteaOpts
): Promise<Release> {
  return request<Release>(`/repos/${owner}/${repo}/releases/${id}`, opts)
}

export async function getLatestRelease(
  owner: string, repo: string, opts?: GiteaOpts
): Promise<Release> {
  return request<Release>(`/repos/${owner}/${repo}/releases/latest`, opts)
}

export async function createRelease(
  owner: string, repo: string,
  data: { tag_name: string; name: string; body?: string; draft?: boolean; prerelease?: boolean },
  opts?: GiteaOpts
): Promise<Release> {
  return request<Release>(`/repos/${owner}/${repo}/releases`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export interface Branch {
  name: string
  commit: { id: string; message: string }
  protected: boolean
}

export async function listBranches(
  owner: string, repo: string, opts?: GiteaOpts
): Promise<Branch[]> {
  return request<Branch[]>(`/repos/${owner}/${repo}/branches`, opts)
}

export async function getBranch(
  owner: string, repo: string, branch: string, opts?: GiteaOpts
): Promise<Branch> {
  return request<Branch>(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, opts)
}

// ─── Commits ──────────────────────────────────────────────────────────────────

export interface Commit {
  sha: string
  commit: {
    author: { name: string; email: string; date: string }
    committer: { name: string; email: string; date: string }
    message: string
  }
  html_url: string
}

export async function listCommits(
  owner: string, repo: string, opts?: { ref?: string } & GiteaOpts
): Promise<Commit[]> {
  const qs = opts?.ref ? `?sha=${encodeURIComponent(opts.ref)}` : ''
  return request<Commit[]>(`/repos/${owner}/${repo}/commits${qs}`, opts)
}

export async function getCommit(
  owner: string, repo: string, ref: string, opts?: GiteaOpts
): Promise<Commit> {
  return request<Commit>(`/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`, opts)
}