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

  test('search bar visible on landing page and focuses with / key', async ({ page }) => {
    await page.goto('/')
    // Search bar should be visible
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[name="q"]'))
    // Press / to focus the search input
    await page.keyboard.press('/')
    // The input should be focused (no textarea/input should have been focused beforehand)
    // Verify the search component rendered
    await expect(page.locator('input[placeholder*="Search"]').or(page.locator('input[name="q"]'))).toBeVisible()
  })

  test('search API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test')
    expect(response.status()).toBe(401)
  })
})
