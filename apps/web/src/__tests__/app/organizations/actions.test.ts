import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock gitea-bridge
const mockCreateOrg = vi.fn()
const mockAddOrgMember = vi.fn()
const mockRemoveOrgMember = vi.fn()
const mockUpdateOrg = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@forge-git/gitea-bridge', () => ({
  createOrg: (...args: unknown[]) => mockCreateOrg(...args),
  addOrgMember: (...args: unknown[]) => mockAddOrgMember(...args),
  removeOrgMember: (...args: unknown[]) => mockRemoveOrgMember(...args),
  updateOrg: (...args: unknown[]) => mockUpdateOrg(...args),
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

// Mock @forge-git/db
const mockUpsertOrgByGiteaId = vi.fn()
const mockDeleteOrgByName = vi.fn()
const mockAddMember = vi.fn()
const mockRemoveMember = vi.fn()
const mockFindOrCreateUserByGiteaId = vi.fn()

vi.mock('@forge-git/db/orgs', () => ({
  upsertOrgByGiteaId: (...args: unknown[]) => mockUpsertOrgByGiteaId(...args),
  deleteOrgByName: (...args: unknown[]) => mockDeleteOrgByName(...args),
}))

vi.mock('@forge-git/db/members', () => ({
  addMember: (...args: unknown[]) => mockAddMember(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
}))

vi.mock('@forge-git/db/users', () => ({
  findOrCreateUserByGiteaId: (...args: unknown[]) => mockFindOrCreateUserByGiteaId(...args),
}))

vi.mock('@forge-git/db/client', () => ({
  getDb: vi.fn().mockReturnValue({}),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue({ baseUrl: 'http://gitea', token: 'tok' }),
}))

import { createOrgAction, addMemberAction, removeMemberAction, deleteOrgAction } from '@/app/organizations/actions'

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('createOrgAction', () => {
  it('calls gitea createOrg then DB upsertOrgByGiteaId', async () => {
    mockCreateOrg.mockResolvedValue({ id: 42, name: 'acme', full_name: 'Acme Inc', description: 'Cool org' })

    const fd = new FormData()
    fd.set('name', 'acme')
    fd.set('full_name', 'Acme Inc')
    fd.set('description', 'Cool org')

    await createOrgAction({ error: '', field: '' }, fd)

    expect(mockCreateOrg).toHaveBeenCalled()
    expect(mockUpsertOrgByGiteaId).toHaveBeenCalledWith(expect.anything(), {
      giteaId: 42,
      giteaOrg: 'acme',
      displayName: 'Acme Inc',
      description: 'Cool org',
    })
  })

  it('still redirects if DB upsert fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockCreateOrg.mockResolvedValue({ id: 42, name: 'acme', full_name: null, description: null })
    mockUpsertOrgByGiteaId.mockRejectedValue(new Error('DB down'))

    const fd = new FormData()
    fd.set('name', 'acme')

    await expect(createOrgAction({ error: '', field: '' }, fd)).resolves.not.toThrow()

    expect(mockUpsertOrgByGiteaId).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[forge-db] upsertOrgByGiteaId failed'),
      expect.any(Error),
    )
    errorSpy.mockRestore()
  })

  it('returns error if gitea createOrg fails (no DB write)', async () => {
    mockCreateOrg.mockRejectedValue(new Error('Gitea 409: conflict'))

    const fd = new FormData()
    fd.set('name', 'acme')

    const result = await createOrgAction({ error: '', field: '' }, fd)

    expect(result.error).toContain('already exists')
    expect(mockUpsertOrgByGiteaId).not.toHaveBeenCalled()
  })
})

describe('addMemberAction', () => {
  it('calls addOrgMember, getUser, findOrCreateUserByGiteaId, addMember', async () => {
    mockAddOrgMember.mockResolvedValue(undefined)
    mockGetUser.mockResolvedValue({ id: 99, login: 'alice', email: 'alice@example.com' })
    mockFindOrCreateUserByGiteaId.mockResolvedValue({ id: 'user-1' })

    const fd = new FormData()
    fd.set('org', 'acme')
    fd.set('username', 'alice')

    await addMemberAction({ error: '', field: '' }, fd)

    expect(mockAddOrgMember).toHaveBeenCalledWith('acme', 'alice', expect.anything())
    expect(mockGetUser).toHaveBeenCalledWith('alice', expect.anything())
    expect(mockFindOrCreateUserByGiteaId).toHaveBeenCalledWith(expect.anything(), {
      giteaUserId: 99,
      username: 'alice',
      email: 'alice@example.com',
    })
    expect(mockAddMember).toHaveBeenCalledWith(expect.anything(), {
      orgName: 'acme',
      userId: 'user-1',
      role: 'member',
    })
  })
})

describe('removeMemberAction', () => {
  it('calls removeOrgMember then removeMember', async () => {
    mockRemoveOrgMember.mockResolvedValue(undefined)
    mockGetUser.mockResolvedValue({ id: 99, login: 'alice', email: 'a@e.com' })
    mockFindOrCreateUserByGiteaId.mockResolvedValue({ id: 'user-1' })

    const fd = new FormData()
    fd.set('org', 'acme')
    fd.set('username', 'alice')

    await removeMemberAction({ error: '', field: '' }, fd)

    expect(mockRemoveOrgMember).toHaveBeenCalledWith('acme', 'alice', expect.anything())
    expect(mockRemoveMember).toHaveBeenCalledWith(expect.anything(), {
      orgName: 'acme',
      userId: 'user-1',
    })
  })
})

describe('deleteOrgAction', () => {
  it('calls gitea DELETE then DB deleteOrgByName', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') })
    mockDeleteOrgByName.mockResolvedValue(undefined)

    const fd = new FormData()
    fd.set('orgName', 'acme')

    await deleteOrgAction({ error: '', field: '' }, fd)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/orgs/acme'),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(mockDeleteOrgByName).toHaveBeenCalledWith(expect.anything(), 'acme')
  })
})
