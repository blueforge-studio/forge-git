export default function BuildsLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="h-7 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-4 w-56 bg-secondary rounded animate-pulse mt-2" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/50 px-4 py-3 grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 bg-secondary rounded animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3 grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="h-4 bg-secondary rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
