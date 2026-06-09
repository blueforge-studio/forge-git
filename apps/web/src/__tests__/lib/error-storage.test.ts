import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}))

// Must import after mock so the Pool constructor is mocked
async function importFresh() {
  vi.resetModules()
  mockQuery.mockReset()
  return import('@/lib/error-storage')
}

describe('PgStorageAdapter', () => {
  beforeEach(() => {
    vi.resetModules()
    mockQuery.mockReset()
  })

  describe('getErrorGroup', () => {
    it('returns group when found', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({
        rows: [{
          fingerprint: 'abc123', message: 'test error', stack: null,
          app_name: 'forge-git', environment: 'test',
          first_seen: '2026-01-01', last_seen: '2026-01-02',
          last_url: '/test', count: 5, status: 'open',
        }],
      })

      const group = await adapter.getErrorGroup('abc123')

      expect(group).not.toBeNull()
      expect(group?.fingerprint).toBe('abc123')
      expect(group?.message).toBe('test error')
      expect(group?.count).toBe(5)
    })

    it('returns null when not found', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const group = await adapter.getErrorGroup('nope')

      expect(group).toBeNull()
    })
  })

  describe('createErrorGroup', () => {
    it('inserts group into database', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.createErrorGroup({
        fingerprint: 'fp1', message: 'err', stack: null,
        appName: 'forge-git', environment: 'test',
        firstSeen: '2026-01-01', lastSeen: '2026-01-01',
        lastUrl: '/', count: 1, status: 'open',
      })

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('INSERT INTO error_groups')
    })
  })

  describe('updateErrorGroup', () => {
    it('updates group fields', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.updateErrorGroup('fp1', { status: 'resolved', count: 10 })

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('UPDATE error_groups')
      expect(sql).toContain('status')
      expect(sql).toContain('count')
    })

    it('does nothing for empty updates', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()

      await adapter.updateErrorGroup('fp1', {})

      expect(mockQuery).not.toHaveBeenCalled()
    })
  })

  describe('createErrorEvent', () => {
    it('inserts event into database', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.createErrorEvent({
        fingerprint: 'fp1', message: 'err', stack: null,
        componentStack: null, url: '/test', userAgent: 'test-agent',
        userId: null, appName: 'forge-git', environment: 'test',
        timestamp: '2026-01-01T00:00:00Z', metadata: null,
      })

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('INSERT INTO error_events')
    })
  })

  describe('createErrorEventsBatch', () => {
    it('inserts multiple events', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.createErrorEventsBatch([
        { fingerprint: 'fp1', message: 'e1', stack: null, componentStack: null,
          url: '/', userAgent: 'ua', userId: null, appName: 'app', environment: 'dev',
          timestamp: '2026-01-01T00:00:00Z', metadata: null },
        { fingerprint: 'fp1', message: 'e2', stack: null, componentStack: null,
          url: '/2', userAgent: 'ua', userId: null, appName: 'app', environment: 'dev',
          timestamp: '2026-01-01T00:00:01Z', metadata: null },
      ])

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('INSERT INTO error_events')
      expect(mockQuery.mock.calls[0][1]).toHaveLength(22) // 11 cols × 2 rows
    })

    it('skips empty batch', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()

      await adapter.createErrorEventsBatch([])

      expect(mockQuery).not.toHaveBeenCalled()
    })
  })

  describe('queryErrorGroups', () => {
    it('queries with default ordering', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.queryErrorGroups({})

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('ORDER BY last_seen DESC')
      expect(sql).toContain('LIMIT')
    })

    it('filters by status', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.queryErrorGroups({ status: 'open' })

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('status')
      expect(mockQuery.mock.calls[0][1]).toContain('open')
    })
  })

  describe('queryErrorEvents', () => {
    it('queries events for fingerprint', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await adapter.queryErrorEvents({ fingerprint: 'fp1', limit: 10 })

      const sql: string = mockQuery.mock.calls[0][0]
      expect(sql).toContain('fingerprint = $1')
      expect(mockQuery.mock.calls[0][1]).toEqual(['fp1', 10])
    })
  })

  describe('getErrorTrends', () => {
    it('returns trend buckets', async () => {
      const { PgStorageAdapter } = await importFresh()
      const adapter = new PgStorageAdapter()
      mockQuery.mockResolvedValueOnce({
        rows: [{ bucket: '2026-01-01T00:00:00Z', count: 3 }],
      })

      const trends = await adapter.getErrorTrends({
        from: '2026-01-01', to: '2026-01-02',
      })

      expect(trends).toHaveLength(1)
      expect(trends[0].count).toBe(3)
    })
  })
})
