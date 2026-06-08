export default function SearchLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="h-7 w-72 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-40 bg-secondary rounded animate-pulse mt-2" />
      </div>
      <div className="mb-10">
        <div className="h-6 w-32 bg-secondary rounded animate-pulse mb-4" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-full bg-secondary rounded animate-pulse" />
              <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-24 bg-secondary rounded animate-pulse mb-4" />
        <div className="divide-y divide-border border border-border rounded-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="w-4 h-4 bg-secondary rounded animate-pulse" />
              <div className="h-4 flex-1 bg-secondary rounded animate-pulse" />
              <div className="h-4 w-12 bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
