import { test, expect } from '@playwright/test'

test.describe('Authenticated Dashboard', () => {
  test('shows authenticated header', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=forge-git')).toBeVisible()
    await expect(page.locator('text=Repositories')).toBeVisible()
    await expect(page.locator('text=Organizations')).toBeVisible()
    await expect(page.locator('text=Builds')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('shows repository stats on dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Repositories')).toBeVisible()
  })

  test('shows recent repositories section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Recent Repositories')).toBeVisible()
  })

  test('shows recent pull requests section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Recent Pull Requests')).toBeVisible()
  })

  test('shows recent issues section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Recent Issues')).toBeVisible()
  })

  test('navigates to repositories from header', async ({ page }) => {
    await page.goto('/')
    await page.locator('header >> text=Repositories').click()
    await expect(page).toHaveURL(/\/repositories/)
  })

  test('navigates to organizations from header', async ({ page }) => {
    await page.goto('/')
    await page.locator('header >> text=Organizations').click()
    await expect(page).toHaveURL(/\/organizations/)
  })
})
