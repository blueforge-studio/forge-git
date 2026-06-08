import Link from 'next/link'
import { Button } from '@forge-git/ui'
import EmptyState from '@/components/empty-state'
import FeatureGrid from '@/components/feature-grid'
import RepoList from '@/components/repo-list'
import { getSession } from '@/lib/session'
import { Server, LogIn } from 'lucide-react'

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {session ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold">Your Repositories</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your code repositories on {session.baseUrl}
              </p>
            </div>
            <Button asChild>
              <Link href="/repositories/new">New Repository</Link>
            </Button>
          </div>
          <RepoList session={session} />
        </>
      ) : (
        <>
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold mb-3">forge-git</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Self-hosted Git platform with CI/CD, team management, and preview deployments.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  Sign in to get started
                </Link>
              </Button>
            </div>
          </div>

          <FeatureGrid />

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Gitea &bull; Self-hosted &bull; Open Source
            </p>
          </div>
        </>
      )}
    </main>
  )
}
