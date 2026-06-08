import { test, expect } from '@playwright/test'

test.describe('Repositories pages', () => {
  test('create repository page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Organizations pages', () => {
  test('organizations page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('new organization page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/new')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Builds pages', () => {
  test('builds page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/builds')
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
  test('notifications page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Settings page', () => {
  test('settings page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
