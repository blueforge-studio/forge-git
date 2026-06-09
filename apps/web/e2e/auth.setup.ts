import { test as setup } from '@playwright/test'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth-storage.json')

setup('authenticate', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  // Call the test session endpoint to establish an encrypted session cookie
  const resp = await context.request.post('/api/test/session', {
    data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
  })
  const body = await resp.json()
  if (!body.ok) throw new Error(`Failed to create session: ${JSON.stringify(body)}`)

  // Save cookies (including the session cookie) for reuse
  await context.storageState({ path: authFile })
  await context.close()
})
