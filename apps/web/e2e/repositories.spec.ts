import { test, expect } from '@playwright/test'

test.describe('Repositories pages', () => {
  test('create repository page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Search page', () => {
  test('search page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/search')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Notifications page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('redirects with type filter when unauthenticated', async ({ page }) => {
    await page.goto('/notifications?type=Issue')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
