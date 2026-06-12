import { test, expect } from '@playwright/test'

test.describe('OAuth login page', () => {
  test('login page shows OAuth sign in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in with Gitea')).toBeVisible()
    await expect(page.locator('text=One-click sign in')).toBeVisible()
  })

  test('login page has PAT form in details element', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('summary', { hasText: 'Use a personal access token' })).toBeVisible()

    // PAT form is hidden until details is expanded
    const details = page.locator('details').filter({ has: page.locator('input[name="giteaUrl"]') })
    await expect(details.locator('input[name="giteaUrl"]')).not.toBeVisible()

    // Open the details element
    await details.locator('summary').click()
    await expect(page.locator('input[name="giteaUrl"]')).toBeVisible()
    await expect(page.locator('input[name="token"]')).toBeVisible()
  })

  test('login page shows error when OAuth callback has error param', async ({ page }) => {
    await page.goto('/login?error=oauth-access_denied')
    await expect(page.locator('text=You denied the authorization request')).toBeVisible()
  })

  test('login page shows session expired error', async ({ page }) => {
    await page.goto('/login?error=oauth-session-expired')
    await expect(page.locator('text=Your OAuth session expired')).toBeVisible()
  })

  test('login page shows state mismatch error', async ({ page }) => {
    await page.goto('/login?error=oauth-state-mismatch')
    await expect(page.locator('text=Security check failed')).toBeVisible()
  })

  test('login page shows OAuth setup instructions', async ({ page }) => {
    await page.goto('/login')
    const summary = page.locator('summary', { hasText: 'Setting up OAuth' })
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(page.locator('text=Register a new application')).toBeVisible()
  })
})

test.describe('OAuth authorize route', () => {
  test('authorize redirects to login when Gitea URL is not configured', async ({ page }) => {
    // Without GITEA_URL set, the authorize route should redirect to /login
    await page.goto('/api/auth/authorize')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error')
  })
})

test.describe('OAuth callback route', () => {
  test('callback redirects to login when missing code and state', async ({ page }) => {
    await page.goto('/api/auth/callback')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=oauth-missing-params')
  })

  test('callback redirects to login when state cookie is missing', async ({ page }) => {
    await page.goto('/api/auth/callback?code=test-code&state=test-state')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=oauth-session-expired')
  })
})
