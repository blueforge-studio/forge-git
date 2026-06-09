import { test, expect } from '@playwright/test'

test.describe('Authenticated Branches', () => {
  test('shows branches page', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/branches')
    await expect(page.locator('text=Branches')).toBeVisible()
  })

  test('lists branches', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/branches')
    await expect(page.locator('text=main')).toBeVisible()
    await expect(page.locator('text=feat/auth')).toBeVisible()
  })

  test('shows branch commit info', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/branches')
    await expect(page.locator('text=Add auth')).toBeVisible()
  })
})
