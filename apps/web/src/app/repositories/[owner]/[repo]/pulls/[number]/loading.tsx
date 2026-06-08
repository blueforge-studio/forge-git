export default function PullDetailLoading() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="h-10 bg-secondary rounded animate-pulse mb-6" />
      <div className="h-48 bg-secondary rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-secondary rounded animate-pulse" />
        <div className="h-20 bg-secondary rounded animate-pulse" />
      </div>
    </main>
  )
}
