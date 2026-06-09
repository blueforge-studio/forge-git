import { test, expect } from '@playwright/test'

test.describe('Authenticated Commits', () => {
  test('shows commits page', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/commits')
    await expect(page.locator('text=Commits')).toBeVisible()
  })

  test('lists commits', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/commits')
    await expect(page.locator('text=feat: initial commit')).toBeVisible()
  })

  test('shows commit sha', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/commits')
    await expect(page.locator('text=abc123')).toBeVisible()
  })

  test('shows commit author', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/commits')
    await expect(page.locator('text=Test User')).toBeVisible()
  })
})
