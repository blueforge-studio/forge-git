export interface GiteaOrg {
  id: number
  name: string
  full_name: string
  description?: string
  website: string
  location: string
  visibility: 'public' | 'limited' | 'private'
  repo_admin_change_team_access: boolean
  avatar_url: string
  created_at: string
}

export interface CreateOrgRequest {
  name: string
  full_name?: string
  description?: string
  website?: string
  location?: string
  visibility?: 'public' | 'limited' | 'private'
}

export interface OrgMember {
  id: number
  login: string
  full_name?: string
  email?: string
  avatar_url: string
}

export interface Team {
  id: number
  name: string
  description?: string
  permission: 'read' | 'write' | 'admin'
  can_create_org_repo: boolean
  includes_all_repositories: boolean
  updated_at: string
  created_at: string
}
