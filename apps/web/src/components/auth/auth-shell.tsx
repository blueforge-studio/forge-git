import Link from 'next/link'

export function AuthShell({
  tagline,
  children,
}: {
  tagline?: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <BrandAside tagline={tagline} />
      <section className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          <GlassCard>{children}</GlassCard>
        </div>
      </section>
    </main>
  )
}

function BrandAside({ tagline }: { tagline?: string }) {
  return (
    <aside className="hidden md:flex md:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,80,200,0.15),transparent_60%)]" />
      <div className="relative z-10 flex flex-col justify-center px-12 py-16 max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <img
            src="/images/logo-mark.webp"
            alt="Forge git"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-semibold text-xl text-foreground">Forge git</span>
        </Link>
        {tagline ? (
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            {tagline}
          </h2>
        ) : (
          <span className="sr-only">Forge git</span>
        )}
      </div>
    </aside>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card p-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
      <div className="md:hidden text-center mb-6 mt-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <img
            src="/images/logo-mark.webp"
            alt="Forge git"
            width={24}
            height={24}
            className="rounded"
          />
          <span className="font-semibold text-foreground">Forge git</span>
        </Link>
      </div>
      {children}
    </div>
  )
}
