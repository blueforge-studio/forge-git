'use client'

export default function RepositoriesError({
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
        <button
          onClick={reset}
          className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
