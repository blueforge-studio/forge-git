import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listIssueComments, createIssueComment, deleteIssueComment } from '../comment'

const baseComment = { id: 1, body: 'Great work!', html_url: '', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', user: { id: 1, login: 'octocat', full_name: 'Octo Cat', avatar_url: '' } }

beforeEach(() => vi.resetAllMocks())

describe('listIssueComments', () => {
  it('fetches comments for an issue', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseComment]) })
    const result = await listIssueComments('owner', 'repo', 1)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues\/1\/comments$/), expect.any(Object))
    expect(result).toEqual([baseComment])
  })
})

describe('createIssueComment', () => {
  it('sends POST with correct body', async () => {
    const newComment = { ...baseComment, id: 2, body: 'Nice!' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(newComment) })
    const result = await createIssueComment('owner', 'repo', 1, { body: 'Nice!' })
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues\/1\/comments$/), expect.objectContaining({ method: 'POST', body: JSON.stringify({ body: 'Nice!' }) }))
    expect(result).toEqual(newComment)
  })
})

describe('deleteIssueComment', () => {
  it('sends DELETE request for a comment', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) })
    await deleteIssueComment('owner', 'repo', 42)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues\/comments\/42$/), expect.objectContaining({ method: 'DELETE' }))
  })
})
