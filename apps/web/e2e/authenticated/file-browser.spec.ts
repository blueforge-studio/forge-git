import { test, expect } from '@playwright/test'

test.describe('Authenticated File Browser', () => {
  test('shows tree view with files and directories', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend')
    await expect(page.locator('text=testuser/frontend')).toBeVisible()
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Files')).toBeVisible()
  })

  test('navigates to tree view from Files tab', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend')
    await page.locator('text=Files').click()
    await expect(page).toHaveURL(/\/repositories\/testuser\/frontend\/tree/)
  })

  test('shows repository stats on overview', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend')
    await expect(page.locator('text=Default Branch')).toBeVisible()
    await expect(page.locator('text=main')).toBeVisible()
  })
})

test.describe('Authenticated File Viewer', () => {
  test('navigates to blob view', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/blob/main/README.md')
    await expect(page.locator('text=README.md')).toBeVisible()
  })
})
