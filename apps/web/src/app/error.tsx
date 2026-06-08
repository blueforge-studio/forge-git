'use client'

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
      <button
        onClick={reset}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        Try again
      </button>
    </main>
  )
}
