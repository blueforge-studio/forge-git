import { test, expect } from '@playwright/test'

test.describe('User profile page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/users/testuser')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Organization profile page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/testorg/profile')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Organization members page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/testorg/members')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Organization teams page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/testorg/teams')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})

test.describe('Organization settings page', () => {
  test('redirects when unauthenticated', async ({ page }) => {
    await page.goto('/organizations/testorg/settings')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
