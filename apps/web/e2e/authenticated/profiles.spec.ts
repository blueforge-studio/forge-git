import { test, expect } from '@playwright/test'

test.describe('Authenticated User Profile', () => {
  test('shows username and avatar', async ({ page }) => {
    await page.goto('/users/testuser')
    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=@testuser')).toBeVisible()
  })

  test('shows stats bar', async ({ page }) => {
    await page.goto('/users/testuser')
    await expect(page.locator('text=Repositories')).toBeVisible()
    await expect(page.locator('text=Stars')).toBeVisible()
  })

  test('shows organizations section', async ({ page }) => {
    await page.goto('/users/testuser')
    await expect(page.locator('text=Organizations')).toBeVisible()
    await expect(page.locator('text=Test Organization')).toBeVisible()
  })

  test('shows repositories list', async ({ page }) => {
    await page.goto('/users/testuser')
    await expect(page.locator('text=testuser/frontend')).toBeVisible()
    await expect(page.locator('text=testuser/backend')).toBeVisible()
  })

  test('organization link navigates to org page', async ({ page }) => {
    await page.goto('/users/testuser')
    await page.locator('text=Test Organization').click()
    await expect(page).toHaveURL(/\/organizations\/testorg/)
  })
})

test.describe('Authenticated Organization Profile', () => {
  test('shows org name and description', async ({ page }) => {
    await page.goto('/organizations/testorg/profile')
    await expect(page.locator('text=Test Organization')).toBeVisible()
    await expect(page.locator('text=A test organization for E2E testing')).toBeVisible()
  })

  test('shows stats bar', async ({ page }) => {
    await page.goto('/organizations/testorg/profile')
    await expect(page.locator('text=Members')).toBeVisible()
    await expect(page.locator('text=Repositories')).toBeVisible()
    await expect(page.locator('text=Teams')).toBeVisible()
  })

  test('shows member list', async ({ page }) => {
    await page.goto('/organizations/testorg/profile')
    await expect(page.locator('text=testuser')).toBeVisible()
    await expect(page.locator('text=collaborator')).toBeVisible()
  })
})
