import { Issue, GiteaOpts, request } from './types'

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
