import { test, expect } from '@playwright/test'

test.describe('Repository file tree', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/tree')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('redirects for nested path when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/tree/src/components')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Repository blob viewer', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/blob/abc123')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('redirects with path param when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/blob/abc123?path=src/index.ts')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Repository branches', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/branches')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Repository commits', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/commits')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Repository releases', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/repositories/testowner/testrepo/releases')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
