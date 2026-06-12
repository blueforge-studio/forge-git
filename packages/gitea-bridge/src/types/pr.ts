export interface PullRequest {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  merged: boolean
  mergeable: boolean
  comments: number
  html_url: string
  diff_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  merged_at?: string
  merge_commit_sha?: string
  head: { label: string; ref: string; sha: string; repo_id: number }
  base: { label: string; ref: string; sha: string; repo_id: number }
}

export interface Issue {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  comments: number
  html_url: string
  created_at: string
  updated_at: string
  closed_at?: string
  labels: Array<{ id: number; name: string; color: string }>
}

export interface Comment {
  id: number
  body: string
  html_url: string
  created_at: string
  updated_at: string
  user: { id: number; login: string; full_name?: string; avatar_url: string }
}
