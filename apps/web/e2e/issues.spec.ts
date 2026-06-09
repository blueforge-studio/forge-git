import { test, expect } from '@playwright/test'

test.describe('Issues pages', () => {
  test('issues list page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/issues')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('new issue page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/issues/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('issue detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/issues/7')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
