import Link from 'next/link'
import { Button } from '@forge-git/ui'
import { Server, LogIn } from 'lucide-react'
import FeatureGrid from '@/components/feature-grid'
import RepoList from '@/components/repo-list'
import DashboardSections from '@/components/dashboard-sections'
import { getActiveSession } from '@/lib/session'

export default async function HomePage() {
  const session = await getActiveSession()

  if (session) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
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
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
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

      <div className="text-center mt-8">
        <p className="text-xs text-muted-foreground">
          Powered by Gitea &bull; Self-hosted &bull; Open Source
        </p>
      </div>
    </main>
  )
}
