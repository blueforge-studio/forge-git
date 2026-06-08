import Link from 'next/link'
import EmptyState from '@/components/empty-state'
import { getSession } from '@/lib/session'
import { Server } from 'lucide-react'

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Your Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your code repositories
          </p>
        </div>
        {session && (
          <Link
            href="/repositories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            New Repository
          </Link>
        )}
      </div>

      <EmptyState
        icon={Server}
        title={session ? 'No repositories yet' : 'Welcome to forge-git'}
        description={
          session
            ? 'Create your first repository to start hosting with forge-git'
            : 'Sign in with your Gitea token to manage repositories'
        }
        actionLabel={session ? 'Create Repository' : 'Sign in'}
        actionHref={session ? '/repositories/new' : '/login'}
      />
    </main>
  )
}
