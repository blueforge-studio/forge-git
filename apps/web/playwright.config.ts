import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI
    ? {
        command: 'pnpm next start --port 3000',
        port: 3000,
        reuseExistingServer: false,
        timeout: 30000,
      }
    : {
        command: 'pnpm next dev --port 3000',
        port: 3000,
        reuseExistingServer: true,
        timeout: 30000,
      },
})
