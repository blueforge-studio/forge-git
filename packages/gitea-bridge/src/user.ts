import { GiteaUser, GiteaOpts, request } from './types'

export async function getCurrentUser(opts?: GiteaOpts): Promise<GiteaUser> {
  return request<GiteaUser>('/user', opts)
}

export async function getUser(username: string, opts?: GiteaOpts): Promise<GiteaUser> {
  return request<GiteaUser>(`/users/${username}`, opts)
}

export async function updateCurrentUser(
  data: { full_name?: string; email?: string; location?: string; website?: string; description?: string },
  opts?: GiteaOpts
): Promise<GiteaUser> {
  return request<GiteaUser>('/user', {
    init: { method: 'PATCH', body: JSON.stringify(data) },
    ...opts,
  })
}
