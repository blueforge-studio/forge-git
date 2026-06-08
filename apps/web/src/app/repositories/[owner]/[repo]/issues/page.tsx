import { getSession } from '@/lib/session'
import { listIssues } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@forge-git/ui'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ state?: string }>
}

export default async function IssuesPage({ params, searchParams }: Props) {
  const { owner, repo } = await params
  const { state } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  const issueState = (state === 'closed' ? 'closed' : state === 'all' ? 'all' : 'open') as 'open' | 'closed' | 'all'

  let issues
  try {
    issues = await listIssues(owner, repo, { state: issueState, ...session })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="issues" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load issues</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="issues" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Issues</h2>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/repositories/${owner}/${repo}/issues/new`}>
              New Issue
            </Link>
          </Button>
          <div className="flex items-center gap-1 text-sm">
          {(['open', 'closed'] as const).map((s) => (
            <Link
              key={s}
              href={`?state=${s}`}
              className={`px-3 py-1 rounded-md ${
                issueState === s
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

      {issues.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {issueState} issues.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/repositories/${owner}/${repo}/issues/${issue.number}`}
              className="block border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      issue.state === 'open' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                    <h3 className="font-medium text-sm">{issue.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{issue.number}</span>
                    {issue.labels?.map((label) => (
                      <span
                        key={label.id}
                        className="text-xs px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: `#${label.color}40`, color: `#${label.color}` }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  {issue.comments > 0 && <span>{issue.comments} comments</span>}
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
