import { PullRequest, GiteaOpts, request } from './types'

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
