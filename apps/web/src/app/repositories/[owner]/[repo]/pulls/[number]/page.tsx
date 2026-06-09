import { getSession } from '@/lib/session'
import { getPullRequest, listIssueComments } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import PullRequestActions from './pr-actions'
import CommentList from '@/components/comment-list'
import CommentForm from '@/components/comment-form'
import { GitMerge } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string; number: string }>
}

export default async function PullRequestDetailPage({ params }: Props) {
  const { owner, repo, number } = await params
  const prNumber = parseInt(number, 10)
  const session = await getSession()
  if (!session) redirect('/login')

  let pr, comments
  try {
    ;[pr, comments] = await Promise.all([
      getPullRequest(owner, repo, prNumber, session),
      listIssueComments(owner, repo, prNumber, session),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="pull-requests" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load pull request</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="pull-requests" />

      <div className="mb-6">
        <Link
          href={`/repositories/${owner}/${repo}/pulls`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Pull Requests
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold">{pr.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                pr.state === 'open'
                  ? 'border-green-500/30 text-green-600 bg-green-500/10'
                  : pr.merged
                    ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                    : 'border-red-500/30 text-red-600 bg-red-500/10'
              }`}>
                {pr.merged ? 'Merged' : pr.state}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              #{pr.number} opened {new Date(pr.created_at).toLocaleDateString()} &mdash; {pr.comments} comments
            </p>
            <PullRequestActions
              owner={owner}
              repo={repo}
              prNumber={prNumber}
              state={pr.state}
              merged={pr.merged}
            />
          </div>
        </div>

        {pr.body && (
          <div className="border-t border-border pt-4 mt-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{pr.body}</pre>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Head</dt>
          <dd className="text-sm font-mono">{pr.head.label} ({pr.head.sha.slice(0, 7)})</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Base</dt>
          <dd className="text-sm font-mono">{pr.base.label} ({pr.base.sha.slice(0, 7)})</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Mergeable</dt>
          <dd className="text-sm flex items-center gap-2">
            {pr.mergeable ? (
              <>
                <GitMerge className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Yes</span>
              </>
            ) : (
              <span className="text-muted-foreground">No</span>
            )}
          </dd>
        </div>
        {pr.merged_at && (
          <div className="border border-border rounded-lg p-4">
            <dt className="text-xs text-muted-foreground mb-1">Merged At</dt>
            <dd className="text-sm">{new Date(pr.merged_at).toLocaleDateString()}</dd>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="border border-border rounded-lg p-6 mt-6">
        <h2 className="text-sm font-semibold mb-4">Comments</h2>
        <div className="mb-6">
          <CommentForm owner={owner} repo={repo} index={prNumber} />
        </div>
        <CommentList comments={comments} />
      </div>
    </main>
  )
}
