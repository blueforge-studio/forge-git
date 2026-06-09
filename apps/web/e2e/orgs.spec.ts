import { test, expect } from '@playwright/test'

test.describe('Organizations pages', () => {
  test('organizations list page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('new organization page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization members page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme/members')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization teams page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme/teams')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization settings page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme/settings')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization team detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme/teams/1')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('organization profile page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/acme/profile')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
