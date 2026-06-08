import { Server } from 'lucide-react'
import Link from 'next/link'
import EmptyState from '@/components/empty-state'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            <span className="font-semibold">forge-git</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/repositories" className="hover:text-primary">Repositories</Link>
            <Link href="/organizations" className="hover:text-primary">Organizations</Link>
            <Link href="/settings" className="hover:text-primary">Settings</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Your Repositories</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your code repositories</p>
          </div>
          <Link
            href="/repositories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            New Repository
          </Link>
        </div>

        <EmptyState
          icon={Server}
          title="No repositories yet"
          description="Create your first repository to start hosting with forge-git"
          actionLabel="Create Repository"
          actionHref="/repositories/new"
        />
      </main>
    </div>
  )
}
