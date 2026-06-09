import Link from 'next/link'
import { Button } from '@forge-git/ui'
import { Server, LogIn, GitPullRequest, AlertCircle, Box } from 'lucide-react'
import { FolderGit2 } from 'lucide-react'
import FeatureGrid from '@/components/feature-grid'
import DashboardStats from '@/components/dashboard-stats'
import DashboardSections from '@/components/dashboard-sections'
import { getActiveSession } from '@/lib/session'
import { fetchDashboardData } from '@/lib/dashboard-data'

export default async function HomePage() {
  const session = await getActiveSession()

  if (!session) {
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

  // Authenticated — fetch dashboard data with graceful fallbacks
  let dashboard
  let error = ''
  try {
    dashboard = await fetchDashboardData(session)
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.baseUrl}
          </p>
        </div>
        <Button asChild>
          <Link href="/repositories/new">New Repository</Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Unable to load dashboard data: {error}</span>
        </div>
      )}

      {dashboard ? (
        <>
          <DashboardStats
            stats={{
              repoCount: dashboard.repoCount,
              prCount: dashboard.prCount,
              issueCount: dashboard.issueCount,
              buildCount: dashboard.buildCount,
            }}
            icons={{
              repo: <FolderGit2 className="w-5 h-5" />,
              pr: <GitPullRequest className="w-5 h-5" />,
              issue: <AlertCircle className="w-5 h-5" />,
              build: <Box className="w-5 h-5" />,
            }}
          />

          <DashboardSections
            repos={dashboard.repos.slice(0, 5)}
            pulls={dashboard.pulls}
            issues={dashboard.issues}
            builds={dashboard.builds}
          />
        </>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Server className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No data available. Create a repository to get started.
          </p>
        </div>
      )}
    </main>
  )
}
