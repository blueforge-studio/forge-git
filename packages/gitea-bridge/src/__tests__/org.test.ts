import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listOrgs, getOrg, createOrg, listOrgMembers } from '../org'

const baseOrg = { id: 1, name: 'myorg', full_name: 'My Org', website: '', location: '', visibility: 'public' as const, repo_admin_change_team_access: false, avatar_url: '', created_at: '' }

beforeEach(() => vi.resetAllMocks())

describe('listOrgs', () => {
  it('fetches orgs for current user', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseOrg]) })
    const result = await listOrgs()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/user\/orgs$/), expect.any(Object))
    expect(result).toEqual([baseOrg])
  })
})

describe('getOrg', () => {
  it('fetches a single org by name', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseOrg) })
    const result = await getOrg('myorg')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/orgs\/myorg$/), expect.any(Object))
    expect(result).toEqual(baseOrg)
  })
})

describe('createOrg', () => {
  it('sends POST with correct body', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseOrg) })
    const data = { name: 'myorg', full_name: 'My Org' }
    const result = await createOrg(data)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/orgs$/), expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }))
    expect(result).toEqual(baseOrg)
  })
})

describe('listOrgMembers', () => {
  it('fetches members for an org', async () => {
    const mockMembers = [{ id: 1, login: 'octocat', avatar_url: '' }]
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockMembers) })
    const result = await listOrgMembers('myorg')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/orgs\/myorg\/members$/), expect.any(Object))
    expect(result).toEqual(mockMembers)
  })
})
