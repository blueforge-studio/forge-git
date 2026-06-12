/**
 * Mock Gitea API server for E2E testing.
 *
 * Responds to Gitea API requests with canned data so E2E tests
 * can run without a real Gitea instance. Start with:
 *   npx tsx e2e/mock-gitea-server.ts
 */

import http from 'node:http'

const PORT = parseInt(process.env.MOCK_GITEA_PORT ?? '3099', 10)

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function parseUrl(url: string) {
  const u = new URL(url, 'http://localhost')
  return { path: u.pathname, query: u.searchParams }
}

// Special tokens that change mock server behavior for specific test scenarios
const EMPTY_REPOS_TOKEN = 'mock-token-empty-repos'
const EMPTY_ALL_TOKEN = 'mock-token-empty-all'

const server = http.createServer((req, res) => {
  const { path } = parseUrl(req.url ?? '/')

  // ─── Auth ────────────────────────────────────────────────────────
  if (path === '/login/oauth/authorize') {
    return json(res, 200, { redirect_uri: '' })
  }
  if (path === '/login/oauth/access_token') {
    return json(res, 200, { access_token: 'mock-oauth-token', refresh_token: 'mock-refresh', expires_in: 3600 })
  }

  // Require auth header for authenticated endpoints
  const auth = req.headers.authorization
  if (!auth || auth === 'Bearer invalid') {
    return json(res, 401, { message: 'Unauthorized' })
  }

  // ─── User ────────────────────────────────────────────────────────
  if (path === '/api/v1/user') {
    return json(res, 200, {
      id: 1, login: 'testuser', full_name: 'Test User',
      email: 'test@forge.git',
      avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon',
      language: 'en', is_admin: false,
      last_login: new Date().toISOString(),
      created_at: '2024-06-01T00:00:00Z',
      restricted: false,
    })
  }

  if (path === '/api/v1/users/testuser') {
    return json(res, 200, {
      id: 1, login: 'testuser', full_name: 'Test User',
      email: 'test@forge.git',
      avatar_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon',
      language: 'en', is_admin: false,
      last_login: new Date().toISOString(),
      created_at: '2024-06-01T00:00:00Z',
      restricted: false,
    })
  }

  // ─── Repositories ────────────────────────────────────────────────
  if (path === '/api/v1/user/repos' || path === '/api/v1/users/me/repos' || path === '/api/v1/users/testuser/repos') {
    if (auth === `Bearer ${EMPTY_REPOS_TOKEN}` || auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
      return json(res, 200, [])
    }
    return json(res, 200, [
      {
        id: 1, name: 'frontend', full_name: 'testuser/frontend', private: false,
        description: 'React frontend application', empty: false, fork: false, mirror: false,
        size: 1234, stars_count: 12, forks_count: 3, default_branch: 'main', archived: false,
        created_at: '2024-06-15T00:00:00Z', updated_at: '2025-06-01T10:00:00Z',
        permissions: { admin: true, push: true, pull: true },
        owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        html_url: 'http://localhost:3099/testuser/frontend',
      },
      {
        id: 2, name: 'backend', full_name: 'testuser/backend', private: true,
        description: 'Go API server', empty: false, fork: false, mirror: false,
        size: 890, stars_count: 5, forks_count: 1, default_branch: 'main', archived: false,
        created_at: '2024-08-01T00:00:00Z', updated_at: '2025-06-05T14:00:00Z',
        permissions: { admin: true, push: true, pull: true },
        owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        html_url: 'http://localhost:3099/testuser/backend',
        language: 'Go',
      },
      {
        id: 3, name: 'shared-lib', full_name: 'testorg/shared-lib', private: false,
        description: 'Shared utility library', empty: false, fork: false, mirror: false,
        size: 345, stars_count: 20, forks_count: 7, default_branch: 'main', archived: false,
        created_at: '2024-09-01T00:00:00Z', updated_at: '2025-06-08T08:00:00Z',
        permissions: { admin: false, push: true, pull: true },
        owner: { id: 2, login: 'testorg', full_name: 'Test Org', avatar_url: '' },
        html_url: 'http://localhost:3099/testorg/shared-lib',
        language: 'Rust',
      },
    ])
  }

  if (path.startsWith('/api/v1/repos/')) {
    const repoPath = path.replace('/api/v1/repos/', '')
    const [owner, repo] = repoPath.split('/')

    // Repo detail
    if (owner && repo && !path.includes('/git/') && !path.includes('/pulls') && !path.includes('/issues') && !path.includes('/branches') && !path.includes('/commits') && !path.includes('/releases') && !path.includes('/hooks') && !path.includes('/keys') && !path.includes('/teams') && !path.includes('/members') && !path.includes('/branch_protections')) {
      return json(res, 200, {
        id: repo === 'frontend' ? 1 : 2, name: repo, full_name: `${owner}/${repo}`,
        private: repo === 'backend', description: `${repo} description`, empty: false,
        fork: false, mirror: false, size: repo === 'frontend' ? 1234 : 890,
        stars_count: repo === 'frontend' ? 12 : 5,
        forks_count: repo === 'frontend' ? 3 : 1,
        default_branch: 'main', archived: false,
        created_at: '2024-06-15T00:00:00Z', updated_at: '2025-06-01T10:00:00Z',
        permissions: { admin: true, push: true, pull: true },
        owner: { id: 1, login: owner, full_name: owner === 'testuser' ? 'Test User' : 'Test Org', avatar_url: '' },
        html_url: `http://localhost:3099/${owner}/${repo}`,
        language: repo === 'frontend' ? 'TypeScript' : 'Go',
      })
    }

    // Pull Requests
    if (path.includes('/pulls') && !path.includes('/pulls/')) {
      return json(res, 200, [
        {
          id: 101, number: 1, title: 'Add user authentication', state: 'open',
          locked: false, mergeable: true,
          created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-08T12:00:00Z',
          body: 'Implements OAuth2 login flow',
          html_url: `http://localhost:3099/${owner}/${repo}/pulls/1`,
          head: { label: 'feat/auth', ref: 'feat/auth', sha: 'abc123' },
          base: { label: 'main', ref: 'main', sha: 'def456' },
          user: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        },
        {
          id: 102, number: 2, title: 'Fix pagination bug', state: 'open',
          locked: false, mergeable: true,
          created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-07T09:00:00Z',
          body: 'Fixes off-by-one',
          html_url: `http://localhost:3099/${owner}/${repo}/pulls/2`,
          head: { label: 'fix/pagination', ref: 'fix/pagination', sha: 'bbb111' },
          base: { label: 'main', ref: 'main', sha: 'ccc222' },
          user: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        },
      ])
    }

    // Issues
    if (path.includes('/issues') && !path.includes('/issues/')) {
      return json(res, 200, [
        {
          id: 201, number: 1, title: 'Dark mode toggle not working', state: 'open',
          created_at: '2025-06-03T00:00:00Z', updated_at: '2025-06-08T15:00:00Z',
          body: 'The dark mode toggle does not persist.',
          html_url: `http://localhost:3099/${owner}/${repo}/issues/1`,
          user: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        },
      ])
    }

    // Releases
    if (path.includes('/releases')) {
      return json(res, 200, [{
        id: 1, tag_name: 'v1.0.0', name: 'First Release',
        body: 'Initial stable release', draft: false, prerelease: false,
        created_at: '2025-06-01T00:00:00Z', published_at: '2025-06-01T00:00:00Z',
        author: { id: 1, login: 'testuser' }, html_url: '',
      }])
    }

    // Branches
    if (path.includes('/branches')) {
      return json(res, 200, [
        { name: 'main', commit: { id: 'abc123', message: 'Initial commit' } },
        { name: 'feat/auth', commit: { id: 'def456', message: 'Add auth' } },
      ])
    }

    // Commits
    if (path.includes('/commits')) {
      return json(res, 200, [{
        sha: 'abc123', message: 'feat: initial commit\n\nFull body',
        html_url: '', created_at: '2025-06-01T00:00:00Z',
        author: { name: 'Test User', email: 'test@forge.git', date: '2025-06-01T00:00:00Z' },
        committer: { name: 'Test User', email: 'test@forge.git', date: '2025-06-01T00:00:00Z' },
      }])
    }

    // Git trees
    if (path.includes('/git/trees')) {
      return json(res, 200, [
        { path: 'src', type: 'tree', size: 0, sha: 'tree-src' },
        { path: 'src/index.ts', type: 'blob', size: 256, sha: 'blob-index' },
        { path: 'src/app.tsx', type: 'blob', size: 1024, sha: 'blob-app' },
        { path: 'package.json', type: 'blob', size: 512, sha: 'blob-pkg' },
        { path: 'README.md', type: 'blob', size: 2048, sha: 'blob-readme' },
      ])
    }

    // Git blobs
    if (path.includes('/git/blobs')) {
      const content = Buffer.from('import React from "react"\n\nexport default function App() {\n  return <div>Hello Forge Git</div>\n}\n').toString('base64')
      return json(res, 200, { content, encoding: 'base64', size: content.length })
    }
  }

  // ─── Organizations ───────────────────────────────────────────────
  if (path === '/api/v1/user/orgs' || path === '/api/v1/users/testuser/orgs') {
    if (auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
      return json(res, 200, [])
    }
    return json(res, 200, [{
      id: 2, name: 'testorg', full_name: 'Test Organization',
      description: 'A test organization', visibility: 'public',
      website: 'https://testorg.example.com', avatar_url: '',
    }])
  }

  if (path === '/api/v1/orgs/testorg') {
    return json(res, 200, {
      id: 2, name: 'testorg', full_name: 'Test Organization',
      description: 'A test organization for E2E testing',
      visibility: 'public', website: 'https://testorg.example.com',
      avatar_url: '',
    })
  }

  if (path === '/api/v1/orgs/testorg/members') {
    return json(res, 200, [
      { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '', role: 'owner' },
      { id: 2, login: 'collaborator', full_name: 'Collab User', avatar_url: '', role: 'member' },
    ])
  }

  if (path === '/api/v1/orgs/testorg/teams') {
    return json(res, 200, [
      { id: 1, name: 'developers', description: 'Core developers', permission: 'admin', can_create_org_repo: true },
    ])
  }

  if (path === '/api/v1/orgs/testorg/repos') {
    return json(res, 200, [{
      id: 3, name: 'shared-lib', full_name: 'testorg/shared-lib', private: false,
      description: 'Shared utility library', empty: false, fork: false, mirror: false,
      size: 345, stars_count: 20, forks_count: 7, default_branch: 'main', archived: false,
      permissions: { admin: false, push: true, pull: true },
      owner: { id: 2, login: 'testorg', full_name: 'Test Org', avatar_url: '' },
      html_url: 'http://localhost:3099/testorg/shared-lib',
    }])
  }

  // ─── Notifications ───────────────────────────────────────────────
  if (path === '/api/v1/notifications') {
    return json(res, 200, [
      {
        id: 1, unread: true, pinned: false,
        repository: { id: 1, name: 'frontend', full_name: 'testuser/frontend', owner: { login: 'testuser' } },
        subject: { title: 'New PR: Add user authentication', url: '', type: 'PullRequest', state: 'open' },
        updated_at: '2025-06-08T12:00:00Z', created_at: '2025-06-08T12:00:00Z',
      },
      {
        id: 2, unread: false, pinned: false,
        repository: { id: 1, name: 'frontend', full_name: 'testuser/frontend', owner: { login: 'testuser' } },
        subject: { title: 'Dark mode toggle not working', url: '', type: 'Issue', state: 'open' },
        updated_at: '2025-06-08T10:00:00Z', created_at: '2025-06-03T00:00:00Z',
      },
      {
        id: 3, unread: true, pinned: false,
        repository: { id: 2, name: 'backend', full_name: 'testuser/backend', owner: { login: 'testuser' } },
        subject: { title: 'Fix pagination bug', url: '', type: 'PullRequest', state: 'open' },
        updated_at: '2025-06-07T09:00:00Z', created_at: '2025-06-05T00:00:00Z',
      },
    ])
  }

  if (path.match(/^\/api\/v1\/notifications\/\d+$/)) {
    // PATCH mark read
    return json(res, 200, {})
  }

  if (path === '/api/v1/notifications' && req.method === 'PUT') {
    // Mark all read
    return json(res, 200, {})
  }

  // ─── Search ──────────────────────────────────────────────────────
  if (path === '/api/v1/repos/search') {
    return json(res, 200, {
      ok: true,
      data: [
        { id: 1, full_name: 'testuser/frontend', description: 'React frontend', stars_count: 12, language: 'TypeScript' },
        { id: 2, full_name: 'testuser/backend', description: 'Go API', stars_count: 5, language: 'Go' },
      ],
    })
  }

  if (path === '/api/v1/repos/issues/search') {
    if (auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
      return json(res, 200, { ok: true, data: [] })
    }
    const { query } = parseUrl(req.url ?? '/')
    const type = query.get('type')
    if (type === 'pulls') {
      return json(res, 200, { ok: true, data: [{
        id: 101, number: 1, title: 'Add user authentication', state: 'open',
        locked: false, mergeable: true, merged: false,
        created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-08T12:00:00Z',
        html_url: 'http://localhost:3099/testuser/frontend/pulls/1',
        head: { label: 'feat/auth', ref: 'feat/auth', sha: 'abc123' },
        base: { label: 'main', ref: 'main', sha: 'def456' },
        user: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
      }]})
    }
    return json(res, 200, { ok: true, data: [{
      id: 201, number: 1, title: 'Dark mode toggle not working', state: 'open',
      created_at: '2025-06-03T00:00:00Z', updated_at: '2025-06-08T15:00:00Z',
      html_url: 'http://localhost:3099/testuser/frontend/issues/1',
      user: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
    }]})
  }

  // ─── Webhooks ─────────────────────────────────────────────────────
  if (path.match(/^\/api\/v1\/repos\/[^/]+\/[^/]+\/hooks$/)) {
    return json(res, 200, [])
  }

  // ─── Fallback ────────────────────────────────────────────────────
  return json(res, 404, { message: `Mock: not found — ${req.method} ${path}` })
})

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1] ?? '')) {
  server.listen(PORT, () => {
    console.log(`Mock Gitea API running at http://localhost:${PORT}`)
  })
}

export { server }
