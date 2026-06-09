'use client'

import { Button } from '@forge-git/ui'

export default function UserProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="border border-destructive/30 rounded-lg p-8 text-center">
        <p className="text-sm text-destructive mb-1">Something went wrong</p>
        <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  )
}
