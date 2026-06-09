import { test, expect } from '@playwright/test'

test.describe('Authenticated Search', () => {
  test('shows search page with empty state', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('text=Search everything')).toBeVisible()
  })

  test('shows search results for a query', async ({ page }) => {
    await page.goto('/search?q=frontend')
    await expect(page.locator('text=Search results for')).toBeVisible()
    await expect(page.locator('text=frontend')).toBeVisible()
  })

  test('shows repositories section in results', async ({ page }) => {
    await page.goto('/search?q=frontend')
    await expect(page.locator('text=Repositories')).toBeVisible()
  })

  test('shows no results message for non-matching query', async ({ page }) => {
    await page.goto('/search?q=xyznonexistent')
    await expect(page.locator('text=No results found')).toBeVisible()
  })
})
