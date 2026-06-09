import { test, expect } from '@playwright/test'

test.describe('Builds pages', () => {
  test('builds page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/builds')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('build detail page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/builds/123')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
