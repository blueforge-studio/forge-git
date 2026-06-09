import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock pg Pool
const mockQuery = vi.fn()
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}))

// Mock drizzle-orm/node-postgres — Drizzle's PostgreSQL driver
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}))

describe('runMigrations', () => {
  beforeEach(() => {
    vi.resetModules()
    mockQuery.mockReset()
  })

  it('runs migrations only once', async () => {
    const { runMigrations } = await import('@/lib/db')
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await runMigrations()
    await runMigrations()

    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('creates all required tables', async () => {
    const { runMigrations } = await import('@/lib/db')
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await runMigrations()

    const sql: string = mockQuery.mock.calls[0][0]
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS forge_users')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS forge_orgs')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS forge_members')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS forge_previews')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS error_groups')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS error_events')
  })
})

describe('getPool', () => {
  it('returns a Pool instance', async () => {
    const { getPool } = await import('@/lib/db')
    const pool = getPool()
    expect(pool).toBeDefined()
    expect(typeof pool.query).toBe('function')
  })
})
