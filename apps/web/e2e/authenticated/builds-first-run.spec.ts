import { test, expect } from '@playwright/test'

test.describe('Authenticated Builds first-run', () => {
  test.beforeEach(async ({ page }) => {
    // Swap to empty-all session so the page has zero builds
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-all' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-all session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    // Restore default session for subsequent tests
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when no builds exist', async ({ page }) => {
    await page.goto('/builds')
    await expect(
      page.getByRole('heading', { name: /no builds yet/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('builds-first-run-primary-cta')
    ).toHaveAttribute('href', '/repositories')
    await expect(
      page.getByTestId('builds-first-run-secondary-learn')
    ).toBeVisible()
    await expect(
      page.getByTestId('builds-first-run-secondary-browse')
    ).toBeVisible()
    // The trigger-build <details> toggle still renders above the first-run state
    await expect(
      page.locator('summary', { hasText: /trigger manual build/i })
    ).toBeVisible()
  })
})
