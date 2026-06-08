'use client'

import { Button } from '@forge-git/ui'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-muted-foreground/30 mb-4">500</h1>
      <p className="text-lg font-medium mb-2">Something went wrong</p>
      <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
      <Button onClick={reset}>
        Try again
      </Button>
    </main>
  )
}
