import { test, expect } from '@playwright/test'

test.describe('Authenticated Repositories', () => {
  test('lists repositories', async ({ page }) => {
    await page.goto('/repositories')
    await expect(page.locator('text=Repositories')).toBeVisible()
  })

  test('has new repository button', async ({ page }) => {
    await page.goto('/repositories')
    await expect(page.locator('text=New Repository')).toBeVisible()
  })

  test('shows repo details page with nav tabs', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend')
    await expect(page.locator('text=testuser/frontend')).toBeVisible()
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Files')).toBeVisible()
    await expect(page.locator('text=Pull Requests')).toBeVisible()
    await expect(page.locator('text=Issues')).toBeVisible()
    await expect(page.locator('text=Releases')).toBeVisible()
  })
})

test.describe('Authenticated Pull Requests', () => {
  test('lists pull requests', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/pulls')
    await expect(page.locator('text=Pull Requests')).toBeVisible()
  })

  test('has new pull request button', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/pulls')
    await expect(page.locator('text=New Pull Request')).toBeVisible()
  })
})

test.describe('Authenticated Issues', () => {
  test('lists issues', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/issues')
    await expect(page.locator('text=Issues')).toBeVisible()
  })

  test('has new issue button', async ({ page }) => {
    await page.goto('/repositories/testuser/frontend/issues')
    await expect(page.locator('text=New Issue')).toBeVisible()
  })
})
