/**
 * @forge-git/gitea-bridge
 *
 * Typed client for the Gitea API.
 * Wraps the Gitea REST API with strong types + error handling.
 *
 * Gitea API docs: https://docs.gitea.com/api/1.21/overview
 */

function getGiteaUrl(): string {
  return process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
}
function getGiteaToken(): string {
  return process.env.GITEA_TOKEN ?? process.env.FORGE_GIT_TOKEN ?? ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getGiteaUrl()}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGiteaToken()}`,
      ...options?.headers,
    },
    ...options,
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

export async function getCurrentUser(): Promise<GiteaUser> {
  return request<GiteaUser>('/user')
}

export async function getUser(username: string): Promise<GiteaUser> {
  return request<GiteaUser>(`/users/${username}`)
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

export async function listOrgs(): Promise<GiteaOrg[]> {
  return request<GiteaOrg[]>('/user/orgs')
}

export async function getOrg(orgName: string): Promise<GiteaOrg> {
  return request<GiteaOrg>(`/orgs/${orgName}`)
}

export async function createOrg(data: CreateOrgRequest): Promise<GiteaOrg> {
  return request<GiteaOrg>('/orgs', {
    method: 'POST',
    body: JSON.stringify(data),
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

export async function listUserRepos(username: string): Promise<GiteaRepo[]> {
  return request<GiteaRepo[]>(`/users/${username}/repos`)
}

export async function listOrgRepos(org: string): Promise<GiteaRepo[]> {
  return request<GiteaRepo[]>(`/orgs/${org}/repos`)
}

export async function getRepo(owner: string, repo: string): Promise<GiteaRepo> {
  return request<GiteaRepo>(`/repos/${owner}/${repo}`)
}

export async function createRepo(data: CreateRepoRequest): Promise<GiteaRepo> {
  return request<GiteaRepo>('/user/repos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function createOrgRepo(org: string, data: CreateRepoRequest): Promise<GiteaRepo> {
  return request<GiteaRepo>(`/orgs/${org}/repos`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteRepo(owner: string, repo: string): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}`, { method: 'DELETE' })
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

export async function listRepoKeys(owner: string, repo: string): Promise<RepoKey[]> {
  return request<RepoKey[]>(`/repos/${owner}/${repo}/keys`)
}

export async function addRepoKey(owner: string, repo: string, data: { title: string; key: string; read_only?: boolean }): Promise<RepoKey> {
  return request<RepoKey>(`/repos/${owner}/${repo}/keys`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteRepoKey(owner: string, repo: string, keyId: number): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/keys/${keyId}`, { method: 'DELETE' })
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

export async function listWebhooks(owner: string, repo: string): Promise<Webhook[]> {
  return request<Webhook[]>(`/repos/${owner}/${repo}/hooks`)
}

export async function createWebhook(owner: string, repo: string, data: {
  type: string
  config: { url: string; content_type: string; secret?: string }
  events?: string[]
  active?: boolean
}): Promise<Webhook> {
  return request<Webhook>(`/repos/${owner}/${repo}/hooks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteWebhook(owner: string, repo: string, hookId: number): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/hooks/${hookId}`, { method: 'DELETE' })
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

export async function getBranchProtection(owner: string, repo: string, branch: string): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`)
}

export async function setBranchProtection(owner: string, repo: string, branch: string, data: BranchProtection): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
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

export async function listOrgMembers(org: string): Promise<OrgMember[]> {
  return request<OrgMember[]>(`/orgs/${org}/members`)
}

export async function addOrgMember(org: string, username: string): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, { method: 'PUT' })
}

export async function removeOrgMember(org: string, username: string): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, { method: 'DELETE' })
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

export async function listOrgTeams(org: string): Promise<Team[]> {
  return request<Team[]>(`/orgs/${org}/teams`)
}

export async function createTeam(org: string, data: {
  name: string
  description?: string
  permission?: 'read' | 'write' | 'admin'
  repo_names?: string[]
}): Promise<Team> {
  return request<Team>(`/orgs/${org}/teams`, {
    method: 'POST',
    body: JSON.stringify(data),
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