import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listBranches, getBranch, listCommits, getCommit } from '../branch'

const baseBranch = { name: 'main', commit: { id: 'abc123', message: 'Initial commit' }, protected: true }
const baseCommit = { sha: 'abc123', commit: { author: { name: 'Author', email: 'author@example.com', date: '2024-01-01T00:00:00Z' }, committer: { name: 'Committer', email: 'committer@example.com', date: '2024-01-01T00:00:00Z' }, message: 'Fix bug' }, html_url: '' }

beforeEach(() => vi.resetAllMocks())

describe('listBranches', () => {
  it('fetches branches for a repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseBranch]) })
    const result = await listBranches('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/branches$/), expect.any(Object))
    expect(result).toEqual([baseBranch])
  })
})

describe('getBranch', () => {
  it('fetches a single branch', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseBranch) })
    const result = await getBranch('owner', 'repo', 'main')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/branches\/main$/), expect.any(Object))
    expect(result).toEqual(baseBranch)
  })
})

describe('listCommits', () => {
  it('fetches commits for a repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseCommit]) })
    const result = await listCommits('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/commits$/), expect.any(Object))
    expect(result).toEqual([baseCommit])
  })
})

describe('getCommit', () => {
  it('fetches a single commit by ref', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseCommit) })
    const result = await getCommit('owner', 'repo', 'abc123')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/commits\/abc123$/), expect.any(Object))
    expect(result).toEqual(baseCommit)
  })
})
