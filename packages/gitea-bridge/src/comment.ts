import { Comment, GiteaOpts, request } from './types'

export async function listIssueComments(
  owner: string, repo: string, index: number, opts?: GiteaOpts
): Promise<Comment[]> {
  return request<Comment[]>(`/repos/${owner}/${repo}/issues/${index}/comments`, opts)
}

export async function createIssueComment(
  owner: string, repo: string, index: number,
  data: { body: string },
  opts?: GiteaOpts
): Promise<Comment> {
  return request<Comment>(`/repos/${owner}/${repo}/issues/${index}/comments`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function deleteIssueComment(
  owner: string, repo: string, id: number, opts?: GiteaOpts
): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/issues/comments/${id}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}
