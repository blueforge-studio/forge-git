import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUser, getUser, updateCurrentUser } from '../user'

beforeEach(() => vi.resetAllMocks())

describe('getCurrentUser', () => {
  it('fetches the current user', async () => {
    const mockUser = { id: 1, login: 'octocat', full_name: 'Octo Cat', email: 'octo@example.com', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockUser) })

    const result = await getCurrentUser()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/user$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }) })
    )
    expect(result).toEqual(mockUser)
  })
})

describe('getUser', () => {
  it('fetches a user by username', async () => {
    const mockUser = { id: 2, login: 'octocat', full_name: 'Octo Cat', email: 'octo@example.com', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockUser) })

    const result = await getUser('octocat')

    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/users\/octocat$/), expect.any(Object))
    expect(result).toEqual(mockUser)
  })
})

describe('updateCurrentUser', () => {
  it('sends PATCH with the correct body', async () => {
    const mockUser = { id: 1, login: 'octocat', full_name: 'Updated Name', email: 'octo@example.com', avatar_url: '', is_admin: false, created_at: '2024-01-01T00:00:00Z' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockUser) })

    const data = { full_name: 'Updated Name', location: 'Everywhere' }
    const result = await updateCurrentUser(data)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/user$/),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify(data) })
    )
    expect(result).toEqual(mockUser)
  })
})
