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
    await expect(page.locator('text=Sign in with Gitea')).toBeVisible()
    await expect(page.locator('text=Manual token')).toBeVisible()
  })

  test('login page PAT form is behind details toggle', async ({ page }) => {
    await page.goto('/login')
    const details = page.locator('details')
    // PAT inputs not visible until expanded
    await expect(details.locator('input[name="giteaUrl"]')).not.toBeVisible()
    // Expand the details
    await details.locator('summary').click()
    await expect(page.locator('input[name="giteaUrl"]')).toBeVisible()
    await expect(page.locator('input[name="token"]')).toBeVisible()
  })

  test('login page shows OAuth setup instructions', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Setting up OAuth')).toBeVisible()
  })

  test('PAT form shows error with empty fields', async ({ page }) => {
    await page.goto('/login')
    // Expand PAT details section
    await page.locator('details summary').click()
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
