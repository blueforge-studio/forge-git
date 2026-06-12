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
    await expect(page.locator('h1')).toHaveText('Welcome back')
    await expect(page.locator('a', { hasText: 'Sign in with Gitea' })).toBeVisible()
    await expect(page.locator('summary', { hasText: 'Use a personal access token' })).toBeVisible()
    await expect(page.getByRole('link', { name: /new here\?.*create a gitea account/i })).toBeVisible()

    // Open PAT details to verify the "Forgot your Gitea URL?" link
    await page.locator('summary', { hasText: 'Use a personal access token' }).click()
    await expect(page.getByRole('link', { name: /forgot your gitea url\?/i })).toBeVisible()
  })

  test('login page PAT form is behind details toggle', async ({ page }) => {
    await page.goto('/login')
    const details = page.locator('details').filter({ has: page.locator('input[name="giteaUrl"]') })
    await expect(details.locator('input[name="giteaUrl"]')).not.toBeVisible()
    await details.locator('summary').click()
    await expect(page.locator('input[name="giteaUrl"]')).toBeVisible()
    await expect(page.locator('input[name="token"]')).toBeVisible()
  })

  test('login page shows OAuth setup instructions', async ({ page }) => {
    await page.goto('/login')
    const summary = page.locator('summary', { hasText: 'Setting up OAuth' })
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(page.locator('text=fgit token setup-oauth')).toBeVisible()
  })

  test('PAT form shows error with empty fields', async ({ page }) => {
    await page.goto('/login')
    await page.locator('details summary').first().click()
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

  test('signup page renders helper content', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /don't have an account yet/i })).toBeVisible()
    await expect(page.getByText(/sign up at a public instance/i)).toBeVisible()
    await expect(page.getByText(/self-host gitea/i)).toBeVisible()
    await expect(page.getByText(/ask your team admin/i)).toBeVisible()
    await expect(page.getByText(/create a personal access token/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i }).last()).toBeVisible()
  })

  test('forgot-token page shows empty state without localStorage', async ({ page }) => {
    await page.goto('/forgot-token')
    await expect(page.getByRole('heading', { name: /forgot your gitea url/i })).toBeVisible()
    await expect(page.getByText(/nothing saved on this device/i)).toBeVisible()
    await expect(page.getByText(/check the email invite/i)).toBeVisible()
    await expect(page.getByText(/ask a teammate/i)).toBeVisible()
    await expect(page.getByText(/search your browser history/i)).toBeVisible()
    await expect(page.getByText(/check your team's wiki/i)).toBeVisible()
  })

  test('forgot-token page shows remembered URL with localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('forge-git:last-gitea-url', 'https://git.example.com')
    })
    await page.goto('/forgot-token')
    await expect(page.getByRole('heading', { name: /forgot your gitea url/i })).toBeVisible()
    await expect(page.getByText(/we saved this from a previous sign-in/i)).toBeVisible()
    await expect(page.getByText('https://git.example.com')).toBeVisible()
    await expect(page.getByTestId('copy-code-button')).toBeVisible()
  })

  test('forgot-token page copy button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.addInitScript(() => {
      window.localStorage.setItem('forge-git:last-gitea-url', 'https://git.example.com')
    })
    await page.goto('/forgot-token')
    const copyButton = page.getByTestId('copy-code-button')
    await copyButton.click()
    await expect(copyButton).toContainText(/copied/i)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe('https://git.example.com')
  })

  test('callback page shows signing in state', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page.getByRole('heading', { name: /signing you in/i })).toBeVisible()
    await expect(page.getByText(/finishing your gitea session/i)).toBeVisible()
  })

  test('callback page shows error card on oauth error', async ({ page }) => {
    await page.goto('/auth/callback?error=oauth-token-invalid')
    await expect(page.getByRole('heading', { name: /couldn't sign you in/i })).toBeVisible()
    await expect(page.getByTestId('callback-error').getByRole('alert')).toContainText(/invalid token/i)
    await expect(page.getByTestId('callback-try-again')).toBeVisible()
  })

  test('callback page redirects to login on unknown state', async ({ page }) => {
    // No ?status=success and no ?error= — should redirect to /login after 3s safety net
    await page.goto('/auth/callback')
    // The 600ms success redirect won't fire (no ?status=success), but the 3s safety net will
    await page.waitForURL(/\/login/, { timeout: 5000 })
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
