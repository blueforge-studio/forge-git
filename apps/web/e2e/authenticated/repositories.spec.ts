import { test, expect } from '@playwright/test'

test.describe('Authenticated Repositories', () => {
  test('lists repositories', async ({ page }) => {
    await page.goto('/repositories')
    await expect(
      page.getByRole('heading', { name: 'Repositories', level: 1 })
    ).toBeVisible()
  })

  test('has new repository button', async ({ page }) => {
    await page.goto('/repositories')
    await expect(
      page.getByRole('link', { name: 'New Repository' })
    ).toBeVisible()
  })

  test('shows repo details page with nav tabs', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend')
    await expect(
      page.getByRole('heading', { name: 'testuser/frontend' })
    ).toBeVisible()
    // Nav tabs are <Link> elements in RepoSettingsNav
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Files', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pull Requests', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Issues', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Releases', exact: true })).toBeVisible()
  })
})

test.describe('Authenticated Pull Requests', () => {
  test('lists pull requests', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/pulls')
    await expect(
      page.getByRole('heading', { name: 'Pull Requests', level: 2 })
    ).toBeVisible()
  })

  test('has new pull request button', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/pulls')
    await expect(
      page.getByRole('link', { name: 'New Pull Request' })
    ).toBeVisible()
  })
})

test.describe('Authenticated Issues', () => {
  test('lists issues', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/issues')
    await expect(
      page.getByRole('heading', { name: 'Issues', level: 2 })
    ).toBeVisible()
  })

  test('has new issue button', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/issues')
    await expect(
      page.getByRole('link', { name: 'New Issue' })
    ).toBeVisible()
  })
})

test.describe('Authenticated Repositories empty state', () => {
  test.beforeEach(async ({ page }) => {
    // Swap the session token so the mock Gitea server returns zero repos
    // (see Task 3: EMPTY_REPOS_TOKEN in mock-gitea-server.ts).
    // Use page.context().request so the new session cookie is shared with
    // the page (the standalone `request` fixture has its own cookie jar).
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-repos' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-repos session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    // Restore the default 3-repo session for subsequent tests
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when user has zero repositories', async ({ page }) => {
    await page.goto('/repositories')
    await expect(
      page.getByRole('heading', { name: /welcome to forge-git/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-primary-cta')
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-secondary-org')
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-secondary-learn')
    ).toBeVisible()
    // The top header still renders alongside the empty state
    await expect(page.getByRole('link', { name: /new repository/i })).toBeVisible()
  })

  test('primary CTA navigates to new repo page', async ({ page }) => {
    await page.goto('/repositories')
    await page.getByTestId('first-run-primary-cta').click()
    await expect(page).toHaveURL(/\/repositories\/new/)
  })

  test('learn more card opens in a new tab to Gitea docs', async ({ page }) => {
    await page.goto('/repositories')
    const learnMore = page.getByTestId('first-run-secondary-learn')
    await expect(learnMore).toHaveAttribute('target', '_blank')
    await expect(learnMore).toHaveAttribute('rel', /noopener/)
    await expect(learnMore).toHaveAttribute('href', /docs\.gitea\.com/)
  })

  test('first-run headline renders in all 3 locales', async ({ page }) => {
    // All 3 locales ship with the same English placeholder today (per
    // established pattern). This smoke test guards against any future
    // translation that breaks the new `repositories.firstRun` namespace.
    // The i18n config uses `localePrefix: 'never'`, so locale is selected
    // via the NEXT_LOCALE cookie rather than the URL prefix.
    for (const locale of ['en', 'es', 'zh']) {
      await page.context().addCookies([
        {
          name: 'NEXT_LOCALE',
          value: locale,
          domain: 'localhost',
          path: '/',
        },
      ])
      await page.goto('/repositories')
      await expect(
        page.getByRole('heading', { name: /welcome to forge-git/i })
      ).toBeVisible()
    }
  })
})
