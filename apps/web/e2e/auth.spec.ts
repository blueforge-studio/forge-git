import { test, expect } from '@playwright/test'

test.describe('Unauthenticated pages', () => {
  test('landing page shows feature grid and sign in CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Self-hosted Git Platform').or(page.locator('text=forge-git'))).toBeVisible()
    await expect(page.locator('text=Git Hosting')).toBeVisible()
    await expect(page.locator('text=CI/CD Pipeline')).toBeVisible()
    await expect(page.locator('text=Team Management')).toBeVisible()
  })

  test('login page renders the sign in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in to forge-git')).toBeVisible()
    await expect(page.locator('input[name="giteaUrl"]')).toBeVisible()
    await expect(page.locator('input[name="token"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login page shows error with empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Gitea URL is required')).toBeVisible()
  })

  test('protected pages redirect to login', async ({ page }) => {
    await page.goto('/repositories')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Navigation', () => {
  test('header shows sign in link when unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Sign in')).toBeVisible()
  })

  test('header shows navigation links when on landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()
  })
})
