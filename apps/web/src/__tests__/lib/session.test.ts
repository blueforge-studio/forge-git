import { describe, it, expect, vi, beforeEach } from 'vitest'

// We mock the next/headers module via vitest.config.ts alias.
// The mock exposes a mutable cookieStore so tests can control its behavior.
import { cookies } from 'next/headers'

describe('getSession', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns null when session data is empty', async () => {
    vi.stubEnv('SESSION_SECRET', 'a-very-secret-key-that-is-at-least-32-chars-long')
    const { getSession } = await import('@/lib/session')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns null when token is missing', async () => {
    vi.stubEnv('SESSION_SECRET', 'a-very-secret-key-that-is-at-least-32-chars-long')
    const store = await cookies()
    // Simulate iron-session returning data without token
    store.get = vi.fn(() => ({ baseUrl: 'http://localhost:3001' })) as any
    const { getSession } = await import('@/lib/session')
    const result = await getSession()
    expect(result).toBeNull()
  })
})

describe('getOAuthSession', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns null when no token', async () => {
    vi.stubEnv('SESSION_SECRET', 'a-very-secret-key-that-is-at-least-32-chars-long')
    const { getOAuthSession } = await import('@/lib/session')
    const result = await getOAuthSession()
    expect(result).toBeNull()
  })

  it('returns null when expired', async () => {
    vi.stubEnv('SESSION_SECRET', 'a-very-secret-key-that-is-at-least-32-chars-long')
    const store = await cookies()
    store.get = vi.fn(() => ({
      baseUrl: 'http://localhost:3001',
      token: 'abc123',
      expiresAt: Date.now() - 1000,
    })) as any
    const { getOAuthSession } = await import('@/lib/session')
    const result = await getOAuthSession()
    expect(result).toBeNull()
  })
})

describe('getActiveSession', () => {
  it('returns null when no session exists', async () => {
    vi.stubEnv('SESSION_SECRET', 'a-very-secret-key-that-is-at-least-32-chars-long')
    const { getActiveSession } = await import('@/lib/session')
    const result = await getActiveSession()
    expect(result).toBeNull()
  })
})
