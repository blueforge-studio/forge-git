import { test, expect } from '@playwright/test'

test.describe('Pull requests pages', () => {
  test('pulls list page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/pulls')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('new pull request page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/pulls/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('pull request detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/owner/repo/pulls/42')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
