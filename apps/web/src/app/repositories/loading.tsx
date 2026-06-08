export default function RepositoriesLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="h-7 w-40 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-64 bg-secondary rounded animate-pulse mt-2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-full bg-secondary rounded animate-pulse" />
            <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  )
}
