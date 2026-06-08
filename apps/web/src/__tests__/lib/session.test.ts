import { describe, it, expect, vi } from 'vitest'

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

describe('getSession', () => {
  it('returns null when cookie is not set', async () => {
    mockCookieStore.get.mockReturnValue(undefined)
    const { getSession } = await import('@/lib/session')
    const result = await getSession()
    expect(result).toBeNull()
  })

  it('returns session from valid cookie', async () => {
    const session = { baseUrl: 'http://localhost:3001', token: 'abc123' }
    mockCookieStore.get.mockReturnValue({ value: btoa(JSON.stringify(session)) })
    const { getSession } = await import('@/lib/session')
    const result = await getSession()
    expect(result).toEqual(session)
  })

  it('returns null for corrupt cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'not-valid-base64!!!' })
    const { getSession } = await import('@/lib/session')
    const result = await getSession()
    expect(result).toBeNull()
  })
})

describe('createSession', () => {
  it('sets the session cookie with correct options', async () => {
    mockCookieStore.set.mockClear()
    const { createSession } = await import('@/lib/session')
    await createSession('http://localhost:3001', 'token123')

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'forge-git-session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    )
  })
})

describe('clearSession', () => {
  it('deletes the session cookie', async () => {
    mockCookieStore.delete.mockClear()
    const { clearSession } = await import('@/lib/session')
    await clearSession()
    expect(mockCookieStore.delete).toHaveBeenCalledWith('forge-git-session')
  })
})
