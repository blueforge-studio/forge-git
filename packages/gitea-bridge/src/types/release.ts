export interface Release {
  id: number
  tag_name: string
  name: string
  body?: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at?: string
  html_url: string
  zipball_url: string
  tarball_url: string
}

export interface TreeEntry {
  path: string
  type: 'tree' | 'blob'
  size: number
  sha: string
}

export interface Commit {
  sha: string
  commit: {
    author: { name: string; email: string; date: string }
    committer: { name: string; email: string; date: string }
    message: string
  }
  html_url: string
}
