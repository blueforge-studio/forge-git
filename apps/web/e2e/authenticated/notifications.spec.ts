import { test, expect } from '@playwright/test'

test.describe('Authenticated Notifications', () => {
  test('shows notifications page', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.locator('text=Notifications')).toBeVisible()
  })

  test('shows notification items', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.locator('text=New PR: Add user authentication')).toBeVisible()
    await expect(page.locator('text=Dark mode toggle not working')).toBeVisible()
  })

  test('shows filter buttons', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.locator('button:has-text("All")')).toBeVisible()
    await expect(page.locator('button:has-text("Issues")')).toBeVisible()
    await expect(page.locator('button:has-text("Pull Requests")')).toBeVisible()
    await expect(page.locator('button:has-text("Commits")')).toBeVisible()
  })

  test('filter by Issues shows only issues', async ({ page }) => {
    await page.goto('/notifications')
    await page.locator('button:has-text("Issues")').click()
    await page.waitForURL('**/notifications?type=Issue**')
    await expect(page.locator('text=Dark mode toggle not working')).toBeVisible()
    await expect(page.locator('text=New PR: Add user authentication')).not.toBeVisible()
  })

  test('filter by Pull Requests shows only PRs', async ({ page }) => {
    await page.goto('/notifications')
    await page.locator('button:has-text("Pull Requests")').click()
    await page.waitForURL('**/notifications?type=PullRequest**')
    await expect(page.locator('text=New PR: Add user authentication')).toBeVisible()
    await expect(page.locator('text=Dark mode toggle not working')).not.toBeVisible()
  })

  test('has mark all as read button when unread exists', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.locator('text=Mark all as read')).toBeVisible()
  })

  test('All filter returns to full list', async ({ page }) => {
    await page.goto('/notifications?type=Issue')
    await page.locator('button:has-text("All")').click()
    await page.waitForURL('**/notifications?')
    await expect(page.locator('text=New PR: Add user authentication')).toBeVisible()
  })
})
