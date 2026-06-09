import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const authFile = path.join(__dirname, 'e2e/.auth-storage.json')

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3344',
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project — authenticates once and saves state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Authenticated tests — reuse session cookie from setup
    {
      name: 'authenticated',
      testMatch: /authenticated\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageStateFile: authFile },
      dependencies: ['setup'],
    },

    // Unauthenticated tests — no session cookie
    {
      name: 'chromium',
      testMatch: /^(?!.*authenticated\/).*\.spec\.ts$/,
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI
    ? [
        {
          command: 'npx tsx e2e/mock-gitea-server.ts',
          port: 3099,
          reuseExistingServer: false,
          timeout: 10000,
        },
        {
          command: 'pnpm next start --port 3344',
          port: 3344,
          reuseExistingServer: false,
          timeout: 30000,
        },
      ]
    : [
        {
          command: 'npx tsx e2e/mock-gitea-server.ts',
          port: 3099,
          reuseExistingServer: true,
          timeout: 10000,
        },
        {
          command: 'pnpm next dev --port 3344',
          port: 3344,
          reuseExistingServer: true,
          timeout: 30000,
        },
      ],
})
