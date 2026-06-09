import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTree, getBlob } from '../tree'

beforeEach(() => vi.resetAllMocks())

describe('getTree', () => {
  it('fetches tree for a repo', async () => {
    const mockTree = [{ path: 'README.md', type: 'blob' as const, size: 100, sha: 'abc' }]
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockTree) })
    const result = await getTree('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/git\/trees$/), expect.any(Object))
    expect(result).toEqual(mockTree)
  })
})

describe('getBlob', () => {
  it('fetches a blob by sha', async () => {
    const mockBlob = { content: 'base64content', encoding: 'base64' as const, size: 100 }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockBlob) })
    const result = await getBlob('owner', 'repo', 'abc123')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/git\/blobs\/abc123$/), expect.any(Object))
    expect(result).toEqual(mockBlob)
  })
})
