import { getSession } from '@/lib/session'
import { listPullRequests } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { GitPullRequest } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ state?: string }>
}

export default async function PullRequestsPage({ params, searchParams }: Props) {
  const { owner, repo } = await params
  const { state } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  const prState = (state === 'closed' ? 'closed' : state === 'all' ? 'all' : 'open') as 'open' | 'closed' | 'all'

  let pulls
  try {
    pulls = await listPullRequests(owner, repo, { state: prState, ...session })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="pull-requests" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load pull requests</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="pull-requests" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Pull Requests</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/repositories/${owner}/${repo}/pulls/new`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90"
          >
            New Pull Request
          </Link>
          <div className="flex items-center gap-1 text-sm">
          {(['open', 'closed'] as const).map((s) => (
            <Link
              key={s}
              href={`?state=${s}`}
              className={`px-3 py-1 rounded-md ${
                prState === s
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'open' ? 'Open' : 'Closed'}
            </Link>
          ))}
          </div>
        </div>
      </div>

      {pulls.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <GitPullRequest className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {prState} pull requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pulls.map((pr) => (
            <Link
              key={pr.id}
              href={`/repositories/${owner}/${repo}/pulls/${pr.number}`}
              className="block border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      pr.state === 'open' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                    <h3 className="font-medium text-sm">{pr.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    #{pr.number} by {pr.head.label} &rarr; {pr.base.label}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  {pr.comments > 0 && <span>{pr.comments} comments</span>}
                  <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
