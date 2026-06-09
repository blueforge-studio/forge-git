import { Comment, GiteaOpts, request } from './types'

// ---------------------------------------------------------------------------
// Issue comments
// ---------------------------------------------------------------------------

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

export async function updateIssueComment(
  owner: string, repo: string, id: number,
  data: { body: string },
  opts?: GiteaOpts
): Promise<Comment> {
  return request<Comment>(`/repos/${owner}/${repo}/issues/comments/${id}`, {
    init: { method: 'PATCH', body: JSON.stringify(data) },
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

// ---------------------------------------------------------------------------
// PR review comments (Gitea uses issues/{index}/comments for PR threads too;
// PR review comments are at /pulls/{index}/reviews)
// ---------------------------------------------------------------------------

export interface PullReview {
  id: number
  state: 'APPROVED' | 'REQUEST_CHANGES' | 'COMMENT' | 'REQUEST_REVIEW'
  body: string
  reviewer: { id: number; login: string; avatar_url: string }
  submitted_at: string
}

export interface PullReviewComment {
  id: number
  body: string
  path?: string
  diff_hunk?: string
  line?: number
  author: { id: number; login: string; avatar_url: string }
  created_at: string
  updated_at: string
}

export async function listPullReviews(
  owner: string, repo: string, index: number, opts?: GiteaOpts
): Promise<PullReview[]> {
  return request<PullReview[]>(`/repos/${owner}/${repo}/pulls/${index}/reviews`, opts)
}

export async function createPullReview(
  owner: string, repo: string, index: number,
  data: { body?: string; event?: 'APPROVED' | 'REQUEST_CHANGES' | 'COMMENT'; comments?: Array<{ path: string; body: string; line?: number }> },
  opts?: GiteaOpts
): Promise<PullReview> {
  return request<PullReview>(`/repos/${owner}/${repo}/pulls/${index}/reviews`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function listPullReviewComments(
  owner: string, repo: string, index: number, reviewId: number, opts?: GiteaOpts
): Promise<PullReviewComment[]> {
  return request<PullReviewComment[]>(
    `/repos/${owner}/${repo}/pulls/${index}/reviews/${reviewId}/comments`, opts
  )
}
