import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listReleases, getRelease, createRelease } from '../release'

const baseRelease = { id: 1, tag_name: 'v1.0', name: 'v1.0', draft: false, prerelease: false, created_at: '', html_url: '', zipball_url: '', tarball_url: '' }

beforeEach(() => vi.resetAllMocks())

describe('listReleases', () => {
  it('fetches releases for a repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseRelease]) })
    const result = await listReleases('owner', 'repo')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/releases$/), expect.any(Object))
    expect(result).toEqual([baseRelease])
  })
})

describe('getRelease', () => {
  it('fetches a single release by id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseRelease) })
    const result = await getRelease('owner', 'repo', 1)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/releases\/1$/), expect.any(Object))
    expect(result).toEqual(baseRelease)
  })
})

describe('createRelease', () => {
  it('sends POST with correct body', async () => {
    const newRelease = { ...baseRelease, id: 2, tag_name: 'v2.0', name: 'v2.0' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(newRelease) })
    const data = { tag_name: 'v2.0', name: 'v2.0', body: 'Release notes', draft: false, prerelease: true }
    const result = await createRelease('owner', 'repo', data)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/repo\/releases$/), expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }))
    expect(result).toEqual(newRelease)
  })
})
