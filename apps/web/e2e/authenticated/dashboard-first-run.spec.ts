import { test, expect } from '@playwright/test'

test.describe('Authenticated Dashboard first-run', () => {
  test.beforeEach(async ({ page }) => {
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-all' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-all session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when all sections are empty', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /welcome to forge-git/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('dashboard-first-run-primary-cta')
    ).toHaveAttribute('href', '/repositories/new')
    await expect(
      page.getByTestId('dashboard-first-run-secondary-org')
    ).toBeVisible()
    await expect(
      page.getByTestId('dashboard-first-run-secondary-learn')
    ).toBeVisible()
  })

  test('first-run renders in en, es, and zh', async ({ page }) => {
    for (const locale of ['en', 'es', 'zh'] as const) {
      // Add/overwrite the locale cookie (don't clear — that would drop the auth session).
      await page.context().addCookies([
        { name: 'NEXT_LOCALE', value: locale, domain: 'localhost', path: '/' },
      ])
      await page.goto('/')
      await expect(
        page.getByRole('heading', { name: /welcome to forge-git|forge-git|欢迎/i })
      ).toBeVisible({ timeout: 5000 })
    }
  })
})
