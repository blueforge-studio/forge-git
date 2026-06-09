import { test, expect } from '@playwright/test'

test.describe('Authenticated Webhooks', () => {
  test('shows webhooks page', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/webhooks')
    await expect(page.locator('text=Webhooks')).toBeVisible()
  })

  test('shows webhook setup guide', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/webhooks')
    await expect(page.locator('text=Webhook Setup Guide')).toBeVisible()
  })

  test('shows receiver url', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/webhooks')
    await expect(page.locator('text=Receiver URL:')).toBeVisible()
    await expect(page.locator('text=/api/webhooks/gitea')).toBeVisible()
  })

  test('shows empty webhooks message', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/webhooks')
    await expect(page.locator('text=No webhooks configured.')).toBeVisible()
  })
})
