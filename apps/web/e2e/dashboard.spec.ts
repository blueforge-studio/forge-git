import { test, expect } from '@playwright/test'

test.describe('Dashboard (landing page)', () => {
  test('unauthenticated landing shows feature grid and sign in', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=forge-git')).toBeVisible()
    await expect(page.locator('text=Sign in to get started')).toBeVisible()
    await expect(page.locator('text=Git Hosting')).toBeVisible()
    await expect(page.locator('text=CI/CD Pipeline')).toBeVisible()
    await expect(page.locator('text=Team Management')).toBeVisible()
  })

  test('unauthenticated landing has sign in link', async ({ page }) => {
    await page.goto('/')
    await page.locator('text=Sign in to get started').click()
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('landing page shows footer attribution', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Powered by Gitea')).toBeVisible()
    await expect(page.locator('text=Open Source')).toBeVisible()
  })
})

test.describe('Dashboard redirect', () => {
  test('protected pages redirect unauthenticated users', async ({ page }) => {
    await page.goto('/repositories')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organizations page redirects unauthenticated', async ({ page }) => {
    await page.goto('/organizations')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('settings page redirects unauthenticated', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
