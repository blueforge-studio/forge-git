export default function LoginLoading() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-2/5 bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20">
        <div className="flex flex-col justify-center px-12 py-16 max-w-md w-full">
          <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-6" />
          <div className="h-12 w-full bg-secondary rounded animate-pulse mb-3" />
          <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
        </div>
      </aside>
      <section className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] glass-card p-10 animate-pulse">
          <div className="h-6 w-32 bg-secondary rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-secondary rounded mx-auto mb-6" />
          <div className="h-11 bg-secondary rounded mb-2" />
          <div className="h-3 w-32 bg-secondary rounded mx-auto mb-5" />
          <div className="h-px bg-border mb-5" />
          <div className="h-10 bg-secondary rounded" />
        </div>
      </section>
    </main>
  )
}
