import { Server } from 'lucide-react'
import Link from 'next/link'

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

        {/* Empty state */}
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-lg font-medium mb-1">No repositories yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Create your first repository to start hosting with forge-git</p>
          <Link
            href="/repositories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            Create Repository
          </Link>
        </div>
      </main>
    </div>
  )
}