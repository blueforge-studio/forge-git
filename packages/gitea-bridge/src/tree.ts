import { TreeEntry, GiteaOpts, request } from './types'

export async function getTree(
  owner: string, repo: string, ref?: string, opts?: GiteaOpts
): Promise<TreeEntry[]> {
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : ''
  return request<TreeEntry[]>(`/repos/${owner}/${repo}/git/trees${qs}`, opts)
}

export async function getBlob(
  owner: string, repo: string, sha: string, opts?: GiteaOpts
): Promise<{ content: string; encoding: string; size: number }> {
  return request<{ content: string; encoding: string; size: number }>(
    `/repos/${owner}/${repo}/git/blobs/${sha}`, opts
  )
}
