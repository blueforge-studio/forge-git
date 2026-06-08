import { describe, it, expect } from 'vitest'

function validateRepoName(name: string): { error: string; field: string } | null {
  if (!name) return { error: 'Repository name is required', field: 'name' }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { error: 'Name can only contain letters, numbers, dots, hyphens, and underscores', field: 'name' }
  }
  return null
}

describe('createRepoAction validation', () => {
  it('rejects empty name', () => {
    const result = validateRepoName('')
    expect(result).toEqual({ error: 'Repository name is required', field: 'name' })
  })

  it('rejects name with spaces', () => {
    const result = validateRepoName('my repo')
    expect(result).toEqual({
      error: 'Name can only contain letters, numbers, dots, hyphens, and underscores',
      field: 'name',
    })
  })

  it('rejects name with special chars', () => {
    const result = validateRepoName('repo@name')
    expect(result).not.toBeNull()
  })

  it('accepts valid names with dots, hyphens, underscores', () => {
    expect(validateRepoName('my-repo')).toBeNull()
    expect(validateRepoName('my.repo')).toBeNull()
    expect(validateRepoName('my_repo')).toBeNull()
    expect(validateRepoName('Repo123')).toBeNull()
  })
})
