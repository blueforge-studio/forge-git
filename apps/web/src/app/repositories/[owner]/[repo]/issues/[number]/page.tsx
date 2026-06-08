import { getSession } from '@/lib/session'
import { getIssue } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'

interface Props {
  params: Promise<{ owner: string; repo: string; number: string }>
}

export default async function IssueDetailPage({ params }: Props) {
  const { owner, repo, number } = await params
  const issueNumber = parseInt(number, 10)
  const session = await getSession()
  if (!session) redirect('/login')

  let issue
  try {
    issue = await getIssue(owner, repo, issueNumber, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="issues" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load issue</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="issues" />

      <div className="mb-6">
        <Link
          href={`/repositories/${owner}/${repo}/issues`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Issues
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold">{issue.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                issue.state === 'open'
                  ? 'border-green-500/30 text-green-600 bg-green-500/10'
                  : 'border-purple-500/30 text-purple-600 bg-purple-500/10'
              }`}>
                {issue.state}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              #{issue.number} opened {new Date(issue.created_at).toLocaleDateString()} &mdash; {issue.comments} comments
            </p>
          </div>
        </div>

        {issue.labels && issue.labels.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {issue.labels.map((label) => (
              <span
                key={label.id}
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{ borderColor: `#${label.color}40`, color: `#${label.color}` }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {issue.body && (
          <div className="border-t border-border pt-4 mt-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{issue.body}</pre>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">State</dt>
          <dd className="text-sm capitalize">{issue.state}</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Comments</dt>
          <dd className="text-sm">{issue.comments}</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Created</dt>
          <dd className="text-sm">{new Date(issue.created_at).toLocaleDateString()}</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Updated</dt>
          <dd className="text-sm">{new Date(issue.updated_at).toLocaleDateString()}</dd>
        </div>
      </div>
    </main>
  )
}
