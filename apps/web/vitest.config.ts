import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/headers': path.resolve(__dirname, './src/__tests__/__mocks__/next-headers.ts'),
      '@blueforge-studio/auth-session': path.resolve(__dirname, './src/__tests__/__mocks__/auth-session.ts'),
    },
  },
})
