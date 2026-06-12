import { test, expect } from '@playwright/test'

test.describe('Unauthenticated pages', () => {
  test('landing page shows feature grid and sign in CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('hero-section')).toBeVisible()
    await expect(page.getByTestId('feature-grid')).toBeVisible()
    await expect(page.getByTestId('hero-sign-in-cta')).toBeVisible()
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
    await expect(details.locator('input[name="giteaUrl"]')).not.toBeVisible()
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
    await page.locator('details summary').click()
    await page.locator('details button[type="submit"]').click()
    await expect(page.locator('text=Gitea URL is required')).toBeVisible()
  })

  test('login page remembers last Gitea URL from localStorage', async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('forge-git:last-gitea-url', 'https://demo.example.com')
    })
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await expect(page.locator('input[name="giteaUrl"]')).toHaveValue('https://demo.example.com')
  })

  test('login page URL health check shows reachable status', async ({ page }) => {
    await page.route('**/api/v1/version', (route) => route.fulfill({ status: 200, body: '{}' }))
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await page.locator('input[name="giteaUrl"]').fill('https://test-gitea.example.com')
    await page.locator('input[name="giteaUrl"]').blur()
    await expect(page.getByTestId('url-health-pill')).toHaveText(/Connected to Gitea/, { timeout: 5000 })
  })

  test('login page URL health check shows unreachable status', async ({ page }) => {
    await page.route('**/api/v1/version', (route) => route.abort('failed'))
    await page.goto('/login')
    await page.locator('details summary').first().click()
    await page.locator('input[name="giteaUrl"]').fill('https://broken.example.com')
    await page.locator('input[name="giteaUrl"]').blur()
    await expect(page.getByTestId('url-health-pill')).toHaveText(/Unreachable/, { timeout: 5000 })
  })

  test('login page setup help is collapsed by default', async ({ page }) => {
    await page.goto('/login')
    const setupDetails = page.locator('summary', { hasText: 'Setting up OAuth' })
    await expect(setupDetails).toBeVisible()
    // The <details> containing setup help should not be open
    const setupOpen = await setupDetails.evaluate((el) => (el.closest('details') as HTMLDetailsElement).open)
    expect(setupOpen).toBe(false)
  })

  test('login page setup help copy button copies the code', async ({ page }) => {
    await page.goto('/login')
    // Open setup help
    await page.locator('summary', { hasText: 'Setting up OAuth' }).click()
    // Click the first copy button in setup help
    const copyButton = page.getByTestId('copy-code-button').first()
    await expect(copyButton).toBeVisible()
    await copyButton.click()
    // Button label should flip to "Copied"
    await expect(copyButton).toHaveText(/Copied/, { timeout: 2000 })
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
    await expect(page.getByTestId('site-header').getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('header shows navigation links when on landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()
  })
})
