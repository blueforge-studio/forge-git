import { test, expect } from '@playwright/test'

test.describe('Search pages', () => {
  test('search page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/search')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('search with query param redirects when unauthenticated', async ({ page }) => {
    await page.goto('/search?q=test')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('search bar is not visible on unauthenticated landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[placeholder*="Search"]').or(page.locator('input[name="q"]'))).not.toBeVisible()
  })

  test('search API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test')
    expect(response.status()).toBe(401)
  })
})
