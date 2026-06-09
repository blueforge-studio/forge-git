import { GiteaRepo, SearchResult, Issue, PullRequest, GiteaOpts, request } from './types'

export async function searchRepos(
  query: string, opts?: { page?: number; limit?: number } & GiteaOpts
): Promise<SearchResult<GiteaRepo>> {
  const qs = new URLSearchParams({ q: query })
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.limit) qs.set('limit', String(opts.limit))
  return request<SearchResult<GiteaRepo>>(`/repos/search?${qs}`, opts)
}

export async function searchIssues(
  query: string, opts?: { page?: number; limit?: number; state?: 'open' | 'closed' } & GiteaOpts
): Promise<{ ok: boolean; data: Issue[] }> {
  const qs = new URLSearchParams({ q: query })
  qs.set('type', 'issues')
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.limit) qs.set('limit', String(opts.limit))
  if (opts?.state) qs.set('state', opts.state)
  return request<{ ok: boolean; data: Issue[] }>(`/repos/issues/search?${qs}`, opts)
}

export async function searchPullRequests(
  query: string, opts?: { page?: number; limit?: number; state?: 'open' | 'closed' } & GiteaOpts
): Promise<{ ok: boolean; data: PullRequest[] }> {
  const qs = new URLSearchParams({ q: query, type: 'pulls' })
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.limit) qs.set('limit', String(opts.limit))
  if (opts?.state) qs.set('state', opts.state)
  return request<{ ok: boolean; data: PullRequest[] }>(`/repos/issues/search?${qs}`, opts)
}
