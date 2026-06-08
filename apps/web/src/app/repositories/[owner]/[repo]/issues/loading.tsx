export default function IssuesLoading() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="h-10 bg-secondary rounded animate-pulse mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-secondary rounded animate-pulse" />
        ))}
      </div>
    </main>
  )
}
