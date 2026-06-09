import { test, expect } from '@playwright/test'

test.describe('Authenticated Settings', () => {
  test('shows settings page', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('shows edit profile section', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=Edit Profile')).toBeVisible()
  })

  test('shows sign out section', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=Session')).toBeVisible()
    await expect(page.locator('text=Sign out')).toBeVisible()
  })

  test('shows connection info', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('text=mock-token')).toBeVisible()
  })
})
