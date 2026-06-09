import { test, expect } from '@playwright/test'

test.describe('Authenticated Organizations List', () => {
  test('shows organizations page', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.locator('text=Organizations')).toBeVisible()
  })

  test('shows new organization button', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.locator('text=New Organization')).toBeVisible()
  })

  test('shows organization card', async ({ page }) => {
    await page.goto('/organizations')
    await expect(page.locator('text=Test Organization')).toBeVisible()
  })

  test('navigates to org detail from card', async ({ page }) => {
    await page.goto('/organizations')
    await page.locator('text=Test Organization').first().click()
    await expect(page).toHaveURL(/\/organizations\/testorg/)
  })
})

test.describe('Authenticated Organization Detail', () => {
  test('shows org name', async ({ page }) => {
    await page.goto('/organizations/testorg')
    await expect(page.locator('text=Test Organization')).toBeVisible()
  })

  test('shows org nav tabs', async ({ page }) => {
    await page.goto('/organizations/testorg')
    await expect(page.locator('text=Overview')).toBeVisible()
    await expect(page.locator('text=Repositories')).toBeVisible()
    await expect(page.locator('text=Members')).toBeVisible()
    await expect(page.locator('text=Teams')).toBeVisible()
  })

  test('shows org repositories', async ({ page }) => {
    await page.goto('/organizations/testorg')
    await expect(page.locator('text=shared-lib')).toBeVisible()
  })
})

test.describe('Authenticated Organization Members', () => {
  test('shows member list', async ({ page }) => {
    await page.goto('/organizations/testorg/members')
    await expect(page.locator('text=testuser')).toBeVisible()
    await expect(page.locator('text=collaborator')).toBeVisible()
  })
})

test.describe('Authenticated Organization Teams', () => {
  test('shows teams list', async ({ page }) => {
    await page.goto('/organizations/testorg/teams')
    await expect(page.locator('text=developers')).toBeVisible()
  })
})
