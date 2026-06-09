import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listUserRepos, getRepo, createRepo, deleteRepo } from '../repo'

const baseRepo = { id: 1, name: 'test', full_name: 'owner/test', private: false, fork: false, template: false, html_url: '', ssh_url: '', clone_url: '', default_branch: 'main', created_at: '', updated_at: '', pushed_at: '', size: 0, open_issues_count: 0, open_pr_counter: 0, stars_count: 0, forks_count: 0, watchers_count: 0, visibility: 'public', archived: false }

beforeEach(() => vi.resetAllMocks())

describe('listUserRepos', () => {
  it('fetches repos for a user', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([baseRepo]) })
    const result = await listUserRepos('owner')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/users\/owner\/repos$/), expect.any(Object))
    expect(result).toEqual([baseRepo])
  })
})

describe('getRepo', () => {
  it('fetches a single repo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseRepo) })
    const result = await getRepo('owner', 'test')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/test$/), expect.any(Object))
    expect(result).toEqual(baseRepo)
  })
})

describe('createRepo', () => {
  it('sends POST with the correct body', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(baseRepo) })
    const data = { name: 'new-repo', description: 'A new repo', auto_init: true }
    const result = await createRepo(data)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/user\/repos$/), expect.objectContaining({ method: 'POST', body: JSON.stringify(data) }))
    expect(result).toEqual(baseRepo)
  })
})

describe('deleteRepo', () => {
  it('sends DELETE request and returns undefined on 204', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) })
    const result = await deleteRepo('owner', 'test')
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/repos\/owner\/test$/), expect.objectContaining({ method: 'DELETE' }))
    expect(result).toBeUndefined()
  })
})
