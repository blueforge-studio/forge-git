import { getSession } from '@/lib/session'
import { getRepo } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  GitFork, Star, Eye, Clock,
  AlertCircle, GitPullRequest, Play, CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import { deploymentsQueue } from '@/lib/queue'
import { CopyButton } from './copy-button'
import RepoSettingsNav from '@/components/repo-settings-nav'
import TriggerBuildForm from '@/components/trigger-build-form'

interface Props {
  params: Promise<{ owner: string; repo: string }>
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

  // Fetch latest build status for this repo (graceful degradation)
  let buildStatus: 'none' | 'passing' | 'failing' | 'running' = 'none'
  let latestBuildId: string | undefined
  try {
    const repoId = `${owner}/${repoName}`
    const [completed, failed, active] = await Promise.all([
      deploymentsQueue.getJobs(['completed'], 0, 0),
      deploymentsQueue.getJobs(['failed'], 0, 0),
      deploymentsQueue.getJobs(['active'], 0, 0),
    ])
    const matchRepo = (j: { data: unknown }) => (j.data as { repoId?: string })?.repoId === repoId
    if (active.some(matchRepo)) {
      buildStatus = 'running'
      latestBuildId = active.find(matchRepo)?.id
    } else if (failed.some(matchRepo)) {
      buildStatus = 'failing'
    } else if (completed.some(matchRepo)) {
      buildStatus = 'passing'
    }
  } catch {
    // Redis unavailable — skip build status
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
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
            {buildStatus !== 'none' && (
              <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                buildStatus === 'passing'
                  ? 'border-green-500/30 text-green-600 bg-green-500/10'
                  : buildStatus === 'failing'
                    ? 'border-red-500/30 text-red-600 bg-red-500/10'
                    : 'border-blue-500/30 text-blue-600 bg-blue-500/10'
              }`}>
                {buildStatus === 'passing' ? <CheckCircle2 className="w-3 h-3" />
                  : buildStatus === 'failing' ? <XCircle className="w-3 h-3" />
                  : <Loader2 className="w-3 h-3 animate-spin" />}
                {buildStatus === 'passing' ? 'Build passing'
                  : buildStatus === 'failing' ? 'Build failing'
                  : 'Build running'}
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-muted-foreground">{repo.description}</p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary" />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4" /> {repo.stars_count} stars
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-4 h-4" /> {repo.forks_count} forks
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" /> {repo.watchers_count} watchers
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {repo.open_issues_count} issues
        </span>
        <span className="flex items-center gap-1">
          <GitPullRequest className="w-4 h-4" /> {repo.open_pr_counter} PRs
        </span>
      </div>

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
  // This is a server component — we use a client component for the copy button
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <code className="flex-1 text-xs bg-secondary px-3 py-2 rounded font-mono">{url}</code>
    </div>
  )
}
