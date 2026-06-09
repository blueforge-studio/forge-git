import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listIssues, getIssue, createIssue } from '../issue'

const baseIssue = { id: 1, number: 1, title: 'Bug', state: 'open' as const, comments: 0, html_url: '', created_at: '', updated_at: '', labels: [] }

beforeEach(() => vi.resetAllMocks())

describe('listIssues', () => {
  it('fetches issues for a repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseIssue]) })
    const result = await listIssues('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues$/), expect.any(Object))
    expect(result).toEqual([baseIssue])
  })
})

describe('getIssue', () => {
  it('fetches a single issue by index', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseIssue) })
    const result = await getIssue('owner', 'repo', 1)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues\/1$/), expect.any(Object))
    expect(result).toEqual(baseIssue)
  })
})

describe('createIssue', () => {
  it('sends POST with correct body', async () => {
    const newIssue = { ...baseIssue, number: 2, title: 'New issue' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(newIssue) })
    const data = { title: 'New issue', body: 'Description' }
    const result = await createIssue('owner', 'repo', data)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/issues$/), expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }))
    expect(result).toEqual(newIssue)
  })
})
