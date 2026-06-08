import { getSession } from '@/lib/session'
import { getRepo } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Play } from 'lucide-react'
import { deploymentsQueue } from '@/lib/queue'
import RepoSettingsNav from '@/components/repo-settings-nav'
import TriggerBuildForm from '@/components/trigger-build-form'
import BuildStatusBadge from '@/components/build-status-badge'
import RepoStatsBar from '@/components/repo-stats-bar'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

async function getBuildStatus(owner: string, repoName: string) {
  try {
    const repoId = `${owner}/${repoName}`
    const [completed, failed, active] = await Promise.all([
      deploymentsQueue.getJobs(['completed'], 0, 0),
      deploymentsQueue.getJobs(['failed'], 0, 0),
      deploymentsQueue.getJobs(['active'], 0, 0),
    ])
    const matchRepo = (j: { data: unknown }) => (j.data as { repoId?: string })?.repoId === repoId
    if (active.some(matchRepo)) return { status: 'running' as const, latestBuildId: active.find(matchRepo)?.id as string | undefined }
    if (failed.some(matchRepo)) return { status: 'failing' as const }
    if (completed.some(matchRepo)) return { status: 'passing' as const }
  } catch { /* Redis unavailable */ }
  return { status: 'none' as const }
}

export default async function RepoDetailPage({ params }: Props) {
  const { owner, repo: repoName } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let repo
  try {
    repo = await getRepo(owner, repoName, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load repository</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  const { status: buildStatus } = await getBuildStatus(owner, repoName)

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/repositories" className="hover:text-foreground">Repositories</Link>
        <span>/</span>
        <Link href={`/repositories/${owner}`} className="hover:text-foreground">{owner}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{repoName}</span>
      </div>

      <RepoSettingsNav owner={owner} repo={repoName} activeTab="overview" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">{repo.full_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              repo.private
                ? 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10'
                : 'border-green-500/30 text-green-600 bg-green-500/10'
            }`}>
              {repo.private ? 'Private' : 'Public'}
            </span>
            {repo.archived && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-600 bg-orange-500/10">
                Archived
              </span>
            )}
            {repo.fork && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-600 bg-blue-500/10">
                Fork
              </span>
            )}
            <BuildStatusBadge status={buildStatus} />
          </div>
          {repo.description && (
            <p className="text-sm text-muted-foreground">{repo.description}</p>
          )}
        </div>
      </div>

      <RepoStatsBar
        language={repo.language}
        stars_count={repo.stars_count}
        forks_count={repo.forks_count}
        watchers_count={repo.watchers_count}
        open_issues_count={repo.open_issues_count}
        open_pr_counter={repo.open_pr_counter}
      />

      {/* Clone URLs */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold">Clone</h2>
        <CloneUrlRow label="HTTPS" url={repo.clone_url} />
        <CloneUrlRow label="SSH" url={repo.ssh_url} />
      </div>

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Default Branch</dt>
          <dd className="text-sm font-mono">{repo.default_branch}</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Size</dt>
          <dd className="text-sm">{repo.size} KB</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Created</dt>
          <dd className="text-sm flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {new Date(repo.created_at).toLocaleDateString()}
          </dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Last Push</dt>
          <dd className="text-sm flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {new Date(repo.pushed_at).toLocaleDateString()}
          </dd>
        </div>
      </div>

      {/* Build actions */}
      <div className="border border-border rounded-lg">
        <details>
          <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-secondary/30 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Trigger Build
          </summary>
          <TriggerBuildForm prefill={{ repoId: `${owner}/${repoName}`, branch: repo.default_branch }} />
        </details>
      </div>
    </main>
  )
}

function CloneUrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <code className="flex-1 text-xs bg-secondary px-3 py-2 rounded font-mono">{url}</code>
    </div>
  )
}
