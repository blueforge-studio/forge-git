import { test, expect } from '@playwright/test'

test.describe('Dashboard (landing page)', () => {
  test('unauthenticated landing shows feature grid and sign in', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('hero-section')).toBeVisible()
    await expect(page.getByTestId('hero-sign-in-cta')).toBeVisible()
    await expect(page.getByTestId('feature-grid')).toBeVisible()
    await expect(page.getByTestId('pricing-section')).toBeVisible()
    await expect(page.getByTestId('cta-section')).toBeVisible()
  })

  test('unauthenticated landing has sign in link', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('hero-sign-in-cta').click()
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('landing page shows footer attribution', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByTestId('site-footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/Gitea/).first()).toBeVisible()
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
