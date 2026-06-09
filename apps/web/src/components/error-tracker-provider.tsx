'use client'

import { useEffect, type ReactNode } from 'react'
import { ErrorBoundary, initErrorTracker } from '@blueforge-studio/error-tracker'

export default function ErrorTrackerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initErrorTracker({
      endpoint: '/api/errors/ingest',
      appName: 'forge-git',
      environment: process.env.NODE_ENV ?? 'development',
      sampleRate: 1.0,
      captureConsoleErrors: process.env.NODE_ENV === 'production',
    })
  }, [])

  return <ErrorBoundary>{children}</ErrorBoundary>
}
