import { test, expect } from '@playwright/test'

test.describe('Authenticated Releases', () => {
  test('shows releases page', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/releases')
    await expect(page.locator('text=Releases')).toBeVisible()
  })

  test('shows new release button', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/releases')
    await expect(page.locator('text=New Release')).toBeVisible()
  })

  test('lists releases', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/releases')
    await expect(page.locator('text=First Release')).toBeVisible()
  })

  test('shows release tag', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/releases')
    await expect(page.locator('text=v1.0.0')).toBeVisible()
  })
})
