export interface ForgeGitOrg {
  giteaId: number
  name: string
  displayName: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
}

export interface ForgeGitMember {
  orgId: number
  userId: number
  role: 'owner' | 'admin' | 'member'
}

export interface ForgeGitWorkflow {
  id: string
  orgId: number
  repoId: number
  name: string
  yaml: string
  enabled: boolean
}

export interface ForgeGitPreview {
  id: string
  orgId: number
  repoId: number
  prNumber: number
  commitSha: string
  url: string
  status: 'pending' | 'building' | 'deployed' | 'failed' | 'archived'
  createdAt: Date
}
