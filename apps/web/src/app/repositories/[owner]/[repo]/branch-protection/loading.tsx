export default function BranchProtectionLoading() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="h-10 bg-secondary rounded animate-pulse mb-6" />
      <div className="max-w-lg space-y-3">
        <div className="h-10 bg-secondary rounded animate-pulse" />
        <div className="h-10 bg-secondary rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-secondary rounded animate-pulse" />
        ))}
      </div>
    </main>
  )
}
