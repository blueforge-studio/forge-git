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

test.describe('Build log APIs', () => {
  test('log SSE stream requires authentication', async ({ request }) => {
    const response = await request.get('/api/builds/123/logs')
    expect(response.status()).toBe(401)
  })

  test('log download requires authentication', async ({ request }) => {
    const response = await request.get('/api/builds/123/logs/download')
    expect(response.status()).toBe(401)
  })
})
