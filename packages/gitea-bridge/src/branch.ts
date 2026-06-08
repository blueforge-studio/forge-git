import { Branch, Commit, GiteaOpts, request } from './types'

export async function listBranches(owner: string, repo: string, opts?: GiteaOpts): Promise<Branch[]> {
  return request<Branch[]>(`/repos/${owner}/${repo}/branches`, opts)
}

export async function getBranch(owner: string, repo: string, branch: string, opts?: GiteaOpts): Promise<Branch> {
  return request<Branch>(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, opts)
}

export async function listCommits(
  owner: string, repo: string, opts?: { ref?: string } & GiteaOpts
): Promise<Commit[]> {
  const qs = opts?.ref ? `?sha=${encodeURIComponent(opts.ref)}` : ''
  return request<Commit[]>(`/repos/${owner}/${repo}/commits${qs}`, opts)
}

export async function getCommit(owner: string, repo: string, ref: string, opts?: GiteaOpts): Promise<Commit> {
  return request<Commit>(`/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`, opts)
}
