import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listPullRequests, getPullRequest, createPullRequest, mergePullRequest } from '../pr'

const basePR = { id: 1, number: 1, title: 'Fix bug', state: 'open' as const, merged: false, mergeable: true, comments: 0, html_url: '', diff_url: '', created_at: '', updated_at: '', head: { label: 'head', ref: 'feature', sha: 'abc', repo_id: 1 }, base: { label: 'base', ref: 'main', sha: 'def', repo_id: 1 } }

beforeEach(() => vi.resetAllMocks())

describe('listPullRequests', () => {
  it('fetches PRs for a repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([basePR]) })
    const result = await listPullRequests('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/pulls$/), expect.any(Object))
    expect(result).toEqual([basePR])
  })
})

describe('getPullRequest', () => {
  it('fetches a single PR by index', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(basePR) })
    const result = await getPullRequest('owner', 'repo', 42)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/pulls\/42$/), expect.any(Object))
    expect(result).toEqual(basePR)
  })
})

describe('createPullRequest', () => {
  it('sends POST with correct body', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(basePR) })
    const data = { title: 'New feature', head: 'feature', base: 'main', body: 'Description' }
    const result = await createPullRequest('owner', 'repo', data)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/pulls$/), expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }))
    expect(result).toEqual(basePR)
  })
})

describe('mergePullRequest', () => {
  it('sends POST to merge endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) })
    await mergePullRequest('owner', 'repo', 42)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/pulls\/42\/merge$/), expect.objectContaining({ method: 'POST' }))
  })
})
