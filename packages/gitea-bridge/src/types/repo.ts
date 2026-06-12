export interface GiteaRepo {
  id: number
  name: string
  full_name: string
  owner?: {
    id: number
    login: string
    full_name?: string
    email?: string
    avatar_url: string
  }
  description?: string
  private: boolean
  fork: boolean
  template: boolean
  html_url: string
  ssh_url: string
  clone_url: string
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  language?: string
  open_issues_count: number
  open_pr_counter: number
  stars_count: number
  forks_count: number
  watchers_count: number
  visibility: string
  archived: boolean
}

export interface CreateRepoRequest {
  name: string
  description?: string
  private?: boolean
  auto_init?: boolean
  default_branch?: string
  gitignore_template?: string
  license?: string
  readme?: string
}

export interface RepoKey {
  id: number
  key: string
  title: string
  fingerprint: string
  created_at: string
  read_only: boolean
}

export interface Webhook {
  id: number
  type: string
  config: {
    url: string
    content_type: string
    secret: string
    http_method: string
  }
  events: string[]
  active: boolean
  created_at: string
}

export interface Branch {
  name: string
  commit: { id: string; message: string }
  protected: boolean
}

export interface BranchProtection {
  rule_name: string
  branch_name: string
  enable_push: boolean
  enable_push_whitelist: boolean
  push_whitelist_usernames?: string[]
  enable_merge_whitelist: boolean
  merge_whitelist_usernames?: string[]
  enable_status_check: boolean
  status_check_contexts?: string[]
  require_pull_request: boolean
  dismiss_stale_approvals: boolean
}
