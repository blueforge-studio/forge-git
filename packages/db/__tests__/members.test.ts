import { describe, it, expect, vi, beforeEach } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { forgeMembers, forgeOrgs, forgeUsers } from '../src/schema'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
}
const mockRunMigrations = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/client', () => ({
  runMigrations: () => mockRunMigrations(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Re-establish the chain behavior after clearAllMocks wipes implementations
  mockDb.select.mockReturnThis()
  mockDb.insert.mockReturnThis()
  mockDb.delete.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.innerJoin.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.orderBy.mockReturnThis()
  mockDb.limit.mockReturnThis()
  mockDb.values.mockReturnThis()
})

describe('listMembers', () => {
  it('joins forgeMembers with forgeOrgs and forgeUsers, filtered by orgName', async () => {
    const expected = [
      { orgId: 'org-1', userId: 'user-1', role: 'admin', giteaOrg: 'acme', giteaUsername: 'alice' },
    ]
    vi.mocked(mockDb.orderBy).mockResolvedValue(expected)

    const { listMembers } = await import('../src/members')
    const result = await listMembers(mockDb as any, 'acme')

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalledWith(forgeMembers)
    expect(mockDb.innerJoin).toHaveBeenCalledTimes(2)
    expect(mockDb.where).toHaveBeenCalledWith(eq(forgeOrgs.giteaOrg, 'acme'))
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(result).toBe(expected)
  })
})

describe('addMember', () => {
  it('inserts a forge_members row after resolving orgName to orgId', async () => {
    // First call (orgId lookup) returns the org id
    vi.mocked(mockDb.limit).mockResolvedValueOnce([{ id: 'org-42' }])
    // Second call (insert returning) returns the inserted row
    vi.mocked(mockDb.returning).mockResolvedValueOnce([{ orgId: 'org-42', userId: 'user-1', role: 'member' }])

    const { addMember } = await import('../src/members')
    const result = await addMember(mockDb as any, {
      orgName: 'acme',
      userId: 'user-1',
      role: 'member',
    })

    expect(mockDb.insert).toHaveBeenCalledWith(forgeMembers)
    expect(mockDb.values).toHaveBeenCalledWith({
      orgId: 'org-42',
      userId: 'user-1',
      role: 'member',
    })
    expect(result).toEqual({ orgId: 'org-42', userId: 'user-1', role: 'member' })
  })

  it('throws when the org is not found', async () => {
    vi.mocked(mockDb.limit).mockResolvedValueOnce([])

    const { addMember } = await import('../src/members')

    await expect(
      addMember(mockDb as any, { orgName: 'nonexistent', userId: 'user-1', role: 'member' }),
    ).rejects.toThrow('Org not found: nonexistent')
  })
})

describe('removeMember', () => {
  it('resolves orgName+userId to a composite-key delete', async () => {
    // Mock the orgId lookup (where() returns this, limit() resolves)
    vi.mocked(mockDb.limit).mockResolvedValueOnce([{ id: 'org-42' }])

    const { removeMember } = await import('../src/members')
    await removeMember(mockDb as any, { orgName: 'acme', userId: 'user-1' })

    expect(mockDb.delete).toHaveBeenCalledWith(forgeMembers)
    expect(mockDb.where).toHaveBeenCalledWith(
      and(
        eq(forgeMembers.orgId, 'org-42'),
        eq(forgeMembers.userId, 'user-1'),
      ),
    )
  })

  it('throws when the org is not found', async () => {
    vi.mocked(mockDb.limit).mockResolvedValueOnce([])

    const { removeMember } = await import('../src/members')

    await expect(
      removeMember(mockDb as any, { orgName: 'nonexistent', userId: 'user-1' }),
    ).rejects.toThrow('Org not found: nonexistent')
  })
})
