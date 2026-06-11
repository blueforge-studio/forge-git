import { test, expect } from '@playwright/test'

test.describe('Webhooks page', () => {
  test('webhooks page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/example-org/example-repo/webhooks')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Webhook API receiver', () => {
  test('webhook receiver returns 200 on ping event', async ({ page }) => {
    const response = await page.request.post('/api/webhooks/gitea', {
      headers: {
        'Content-Type': 'application/json',
        'X-Gitea-Event': 'push',
      },
      data: {
        ref: 'refs/heads/main',
        before: '0000000000000000000000000000000000000000',
        after: 'abc123def456',
        compare_url: 'https://gitea.local/org/repo/compare/0000...abc123',
        repository: {
          id: 1,
          name: 'test-repo',
          full_name: 'org/test-repo',
          owner: { id: 1, login: 'org' },
        },
        pusher: { id: 1, login: 'testuser' },
        sender: { id: 1, login: 'testuser' },
      },
    })
    expect(response.status()).toBe(200)
  })

  test('webhook receiver returns 200 on PR open event', async ({ page }) => {
    const response = await page.request.post('/api/webhooks/gitea', {
      headers: {
        'Content-Type': 'application/json',
        'X-Gitea-Event': 'pull_request',
      },
      data: {
        action: 'opened',
        number: 1,
        pull_request: {
          id: 1,
          number: 1,
          title: 'Test PR',
          state: 'open',
          head: { ref: 'feature', sha: 'abc', repo_id: 1 },
          base: { ref: 'main', sha: 'def', repo_id: 1 },
          merged: false,
        },
        repository: {
          id: 1,
          name: 'test-repo',
          full_name: 'org/test-repo',
          owner: { id: 1, login: 'org' },
        },
        sender: { id: 1, login: 'testuser' },
      },
    })
    expect(response.status()).toBe(200)
  })

  test('webhook receiver returns 400 when missing event type header', async ({ page }) => {
    const response = await page.request.post('/api/webhooks/gitea', {
      headers: { 'Content-Type': 'application/json' },
      data: { ref: 'refs/heads/main' },
    })
    expect(response.status()).toBe(400)
  })
})
