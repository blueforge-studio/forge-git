import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchRepos, searchIssues } from '../search'

beforeEach(() => vi.resetAllMocks())

describe('searchRepos', () => {
  it('searches repos with query param', async () => {
    const mockResult = { ok: true, data: [{ id: 1, name: 'test', full_name: 'owner/test' }] }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResult) })
    const result = await searchRepos('test')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/search\?q=test/), expect.any(Object))
    expect(result).toEqual(mockResult)
  })
})

describe('searchIssues', () => {
  it('searches issues with query param', async () => {
    const mockResult = { ok: true, data: [{ id: 1, number: 1, title: 'Bug', state: 'open' as const, comments: 0, html_url: '', created_at: '', updated_at: '', labels: [] }] }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResult) })
    const result = await searchIssues('bug')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/issues\/search\?q=bug/), expect.any(Object))
    expect(result).toEqual(mockResult)
  })
})
