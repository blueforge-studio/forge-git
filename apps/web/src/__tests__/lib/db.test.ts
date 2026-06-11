import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMigrate = vi.fn()

// Mock pg Pool
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
  })),
}))

// Mock drizzle-orm/node-postgres — Drizzle's PostgreSQL driver
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}))

// Mock the migrator sub-path used by runMigrations
vi.mock('drizzle-orm/node-postgres/migrator', () => ({
  migrate: mockMigrate,
}))

describe('runMigrations', () => {
  beforeEach(() => {
    vi.resetModules()
    mockMigrate.mockReset()
  })

  it('runs migrations only once', async () => {
    const { runMigrations } = await import('@/lib/db')

    await runMigrations()
    await runMigrations()

    expect(mockMigrate).toHaveBeenCalledTimes(1)
  })

  it('calls migrate with db instance and migrations folder', async () => {
    const { runMigrations } = await import('@/lib/db')

    await runMigrations()

    expect(mockMigrate).toHaveBeenCalledWith(
      expect.anything(),
      { migrationsFolder: './drizzle' },
    )
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
