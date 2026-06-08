export default function TeamDetailLoading() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="h-4 w-32 bg-secondary rounded animate-pulse mb-6" />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-secondary rounded animate-pulse" />
        <div>
          <div className="h-7 w-40 bg-secondary rounded animate-pulse" />
          <div className="h-4 w-64 bg-secondary rounded animate-pulse mt-1" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-6 w-28 bg-secondary rounded animate-pulse" />
          <div className="h-16 bg-secondary rounded animate-pulse" />
          <div className="h-16 bg-secondary rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-5 w-16 bg-secondary rounded animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
          ))}
          <div className="h-5 w-24 bg-secondary rounded animate-pulse" />
          <div className="h-8 bg-secondary rounded animate-pulse" />
          <div className="h-8 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    </main>
  )
}
