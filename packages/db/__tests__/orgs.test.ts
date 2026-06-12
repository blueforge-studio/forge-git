import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { forgeOrgs } from '../src/schema'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
}
const mockRunMigrations = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/client', () => ({
  runMigrations: () => mockRunMigrations(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Re-establish the chain behavior after clearAllMocks
  mockDb.select.mockReturnThis()
  mockDb.insert.mockReturnThis()
  mockDb.delete.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.orderBy.mockReturnThis()
  mockDb.limit.mockReturnThis()
  mockDb.values.mockReturnThis()
  mockDb.onConflictDoUpdate.mockReturnThis()
  mockDb.set.mockReturnThis()
})

describe('listOrgs', () => {
  it('queries forgeOrgs ordered by createdAt', async () => {
    const expected = [{ id: '1', giteaOrg: 'acme', giteaId: 100 }]
    vi.mocked(mockDb.orderBy).mockResolvedValue(expected)

    const { listOrgs } = await import('../src/orgs')
    const result = await listOrgs(mockDb as any)

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalledWith(forgeOrgs)
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(result).toBe(expected)
  })
})

describe('getOrgByName', () => {
  it('queries forgeOrgs where giteaOrg matches', async () => {
    const expected = { id: '1', giteaOrg: 'acme' }
    vi.mocked(mockDb.limit).mockResolvedValue([expected])

    const { getOrgByName } = await import('../src/orgs')
    const result = await getOrgByName(mockDb as any, 'acme')

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalledWith(eq(forgeOrgs.giteaOrg, 'acme'))
    expect(mockDb.limit).toHaveBeenCalledWith(1)
    expect(result).toBe(expected)
  })

  it('returns null when no row matches', async () => {
    vi.mocked(mockDb.limit).mockResolvedValue([])

    const { getOrgByName } = await import('../src/orgs')
    const result = await getOrgByName(mockDb as any, 'nonexistent')

    expect(result).toBeNull()
  })
})

describe('getOrgByGiteaId', () => {
  it('queries forgeOrgs where giteaId matches', async () => {
    const expected = { id: '1', giteaOrg: 'acme', giteaId: 100 }
    vi.mocked(mockDb.limit).mockResolvedValue([expected])

    const { getOrgByGiteaId } = await import('../src/orgs')
    const result = await getOrgByGiteaId(mockDb as any, 100)

    expect(mockDb.where).toHaveBeenCalledWith(eq(forgeOrgs.giteaId, 100))
    expect(mockDb.limit).toHaveBeenCalledWith(1)
    expect(result).toBe(expected)
  })

  it('returns null when no row matches', async () => {
    vi.mocked(mockDb.limit).mockResolvedValue([])

    const { getOrgByGiteaId } = await import('../src/orgs')
    const result = await getOrgByGiteaId(mockDb as any, 999)

    expect(result).toBeNull()
  })
})

describe('upsertOrgByGiteaId', () => {
  it('inserts with onConflictDoUpdate on gitea_id', async () => {
    const returned = { id: '1', giteaOrg: 'acme', giteaId: 100 }
    vi.mocked(mockDb.returning).mockResolvedValue([returned])

    const { upsertOrgByGiteaId } = await import('../src/orgs')
    const result = await upsertOrgByGiteaId(mockDb as any, {
      giteaId: 100,
      giteaOrg: 'acme',
      displayName: 'Acme',
      description: null,
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith({
      giteaId: 100,
      giteaOrg: 'acme',
      displayName: 'Acme',
      description: null,
    })
    expect(mockDb.onConflictDoUpdate).toHaveBeenCalledWith({
      target: forgeOrgs.giteaId,
      set: {
        giteaOrg: 'acme',
        displayName: 'Acme',
        description: null,
        updatedAt: expect.any(Date),
      },
    })
    expect(result).toBe(returned)
  })
})

describe('deleteOrgByName', () => {
  it('deletes forgeOrgs where giteaOrg matches', async () => {
    const { deleteOrgByName } = await import('../src/orgs')
    await deleteOrgByName(mockDb as any, 'acme')

    expect(mockDb.delete).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalledWith(eq(forgeOrgs.giteaOrg, 'acme'))
  })
})
