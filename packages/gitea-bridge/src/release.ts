import { Release, GiteaOpts, request } from './types'

export async function listReleases(owner: string, repo: string, opts?: GiteaOpts): Promise<Release[]> {
  return request<Release[]>(`/repos/${owner}/${repo}/releases`, opts)
}

export async function getRelease(owner: string, repo: string, id: number, opts?: GiteaOpts): Promise<Release> {
  return request<Release>(`/repos/${owner}/${repo}/releases/${id}`, opts)
}

export async function getLatestRelease(owner: string, repo: string, opts?: GiteaOpts): Promise<Release> {
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
