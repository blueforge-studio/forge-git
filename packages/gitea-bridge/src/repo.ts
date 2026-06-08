import { GiteaRepo, CreateRepoRequest, GiteaOpts, RepoKey, BranchProtection, request } from './types'

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
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function createOrgRepo(org: string, data: CreateRepoRequest, opts?: GiteaOpts): Promise<GiteaRepo> {
  return request<GiteaRepo>(`/orgs/${org}/repos`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function deleteRepo(owner: string, repo: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

export async function listRepoKeys(owner: string, repo: string, opts?: GiteaOpts): Promise<RepoKey[]> {
  return request<RepoKey[]>(`/repos/${owner}/${repo}/keys`, opts)
}

export async function addRepoKey(owner: string, repo: string, data: { title: string; key: string; read_only?: boolean }, opts?: GiteaOpts): Promise<RepoKey> {
  return request<RepoKey>(`/repos/${owner}/${repo}/keys`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function deleteRepoKey(owner: string, repo: string, keyId: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/keys/${keyId}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

export async function getBranchProtection(owner: string, repo: string, branch: string, opts?: GiteaOpts): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`, opts)
}

export async function setBranchProtection(owner: string, repo: string, branch: string, data: BranchProtection, opts?: GiteaOpts): Promise<BranchProtection> {
  return request<BranchProtection>(`/repos/${owner}/${repo}/branch_protections/${encodeURIComponent(branch)}`, {
    init: { method: 'PUT', body: JSON.stringify(data) },
    ...opts,
  })
}
