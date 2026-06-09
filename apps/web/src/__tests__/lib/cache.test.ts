import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()

vi.mock('@/lib/services', () => ({
  cache: {
    get: <T>(key: string) => mockGet(key) as Promise<T | null>,
    set: <T>(key: string, val: T, ttl: number) => mockSet(key, val, ttl) as Promise<void>,
    delete: (key: string) => mockDel(key) as Promise<void>,
  },
}))

describe('cachedGitea', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGet.mockReset()
    mockSet.mockReset()
    mockDel.mockReset()
  })

  it('returns cached value when hit', async () => {
    const { cachedGitea } = await import('@/lib/cache')
    mockGet.mockResolvedValueOnce({ cached: true })

    const fetcher = vi.fn().mockResolvedValue({ fresh: true })
    const result = await cachedGitea('test-key', fetcher)

    expect(result).toEqual({ cached: true })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches and caches on miss', async () => {
    const { cachedGitea } = await import('@/lib/cache')
    mockGet.mockResolvedValueOnce(null)
    const fetcher = vi.fn().mockResolvedValue({ fresh: true })

    const result = await cachedGitea('test-key', fetcher, 60)

    expect(result).toEqual({ fresh: true })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(mockSet).toHaveBeenCalledWith('test-key', { fresh: true }, 60)
  })

  it('falls back to fetcher on cache error', async () => {
    const { cachedGitea } = await import('@/lib/cache')
    mockGet.mockRejectedValueOnce(new Error('Redis down'))
    const fetcher = vi.fn().mockResolvedValue({ fallback: true })

    const result = await cachedGitea('test-key', fetcher)

    expect(result).toEqual({ fallback: true })
  })

  it('uses default TTL of 30 seconds', async () => {
    const { cachedGitea } = await import('@/lib/cache')
    mockGet.mockResolvedValueOnce(null)
    const fetcher = vi.fn().mockResolvedValue('data')

    await cachedGitea('key', fetcher)

    expect(mockSet).toHaveBeenCalledWith('key', 'data', 30)
  })
})

describe('invalidateCache', () => {
  it('deletes key from cache', async () => {
    const { invalidateCache } = await import('@/lib/cache')
    mockDel.mockResolvedValueOnce(undefined)

    await invalidateCache('some-key')

    expect(mockDel).toHaveBeenCalledWith('some-key')
  })
})
