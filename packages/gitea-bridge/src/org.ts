import { GiteaOrg, CreateOrgRequest, GiteaOpts, OrgMember, Team, GiteaRepo, request } from './types'

export async function listOrgs(opts?: GiteaOpts): Promise<GiteaOrg[]> {
  return request<GiteaOrg[]>('/user/orgs', opts)
}

export async function getOrg(orgName: string, opts?: GiteaOpts): Promise<GiteaOrg> {
  return request<GiteaOrg>(`/orgs/${orgName}`, opts)
}

export async function createOrg(data: CreateOrgRequest, opts?: GiteaOpts): Promise<GiteaOrg> {
  return request<GiteaOrg>('/orgs', {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function updateOrg(
  org: string,
  data: { full_name?: string; description?: string; website?: string; location?: string; visibility?: 'public' | 'limited' | 'private' },
  opts?: GiteaOpts
): Promise<GiteaOrg> {
  return request<GiteaOrg>(`/orgs/${org}`, {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function listOrgMembers(org: string, opts?: GiteaOpts): Promise<OrgMember[]> {
  return request<OrgMember[]>(`/orgs/${org}/members`, opts)
}

export async function addOrgMember(org: string, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, {
    init: { method: 'PUT' },
    ...opts,
  })
}

export async function removeOrgMember(org: string, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/orgs/${org}/members/${username}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

export async function listOrgTeams(org: string, opts?: GiteaOpts): Promise<Team[]> {
  return request<Team[]>(`/orgs/${org}/teams`, opts)
}

export async function createTeam(org: string, data: {
  name: string
  description?: string
  permission?: 'read' | 'write' | 'admin'
  repo_names?: string[]
}, opts?: GiteaOpts): Promise<Team> {
  return request<Team>(`/orgs/${org}/teams`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function getTeam(id: number, opts?: GiteaOpts): Promise<Team> {
  return request<Team>(`/teams/${id}`, opts)
}

export async function deleteTeam(id: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/teams/${id}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

export async function updateTeam(
  id: number,
  data: { name?: string; description?: string; permission?: 'read' | 'write' | 'admin' },
  opts?: GiteaOpts
): Promise<Team> {
  return request<Team>(`/teams/${id}`, {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function listTeamMembers(id: number, opts?: GiteaOpts): Promise<OrgMember[]> {
  return request<OrgMember[]>(`/teams/${id}/members`, opts)
}

export async function addTeamMember(id: number, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/teams/${id}/members/${username}`, {
    init: { method: 'PUT' },
    ...opts,
  })
}

export async function removeTeamMember(id: number, username: string, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/teams/${id}/members/${username}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}

export async function listTeamRepos(id: number, opts?: GiteaOpts): Promise<GiteaRepo[]> {
  return request<GiteaRepo[]>(`/teams/${id}/repos`, opts)
}
