import { test, expect } from '@playwright/test'

test.describe('Authenticated Organizations first-run', () => {
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

  test('shows first-run welcome when no organizations exist', async ({ page }) => {
    await page.goto('/organizations')
    await expect(
      page.getByRole('heading', { name: /no organizations yet/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('orgs-first-run-secondary-learn')
    ).toBeVisible()
  })

  test('primary CTA is a button, not a link', async ({ page }) => {
    await page.goto('/organizations')
    const cta = page.getByTestId('orgs-first-run-primary-cta')
    await expect(cta).toBeVisible()
    const tagName = await cta.evaluate((el) => el.tagName)
    expect(tagName).toBe('BUTTON')
  })

  test('clicking primary CTA reveals the inline create form without navigating', async ({ page }) => {
    await page.goto('/organizations')
    const url = page.url()
    await page.getByTestId('orgs-first-run-primary-cta').click()
    expect(page.url()).toBe(url)
    await expect(page.getByTestId('orgs-create-form-wrapper')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /no organizations yet/i })
    ).not.toBeVisible()
  })
})
