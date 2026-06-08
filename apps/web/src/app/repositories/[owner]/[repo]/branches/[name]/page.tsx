import { getSession } from '@/lib/session'
import { getBranch, listCommits } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { GitBranch, Shield, GitCommit } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string; name: string }>
}

export default async function BranchDetailPage({ params }: Props) {
  const { owner, repo, name } = await params
  const branchName = decodeURIComponent(name)
  const session = await getSession()
  if (!session) redirect('/login')

  let branch
  try {
    branch = await getBranch(owner, repo, branchName, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="branches" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load branch</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  let commits: Awaited<ReturnType<typeof listCommits>> = []
  try {
    commits = await listCommits(owner, repo, { ref: branchName, ...session })
  } catch {
    // commits optional
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="branches" />

      <div className="mb-6">
        <Link
          href={`/repositories/${owner}/${repo}/branches`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Branches
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <GitBranch className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold font-mono">{branch.name}</h1>
          {branch.protected && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-600 bg-blue-500/10">
              <Shield className="w-3 h-3" />
              Protected
            </span>
          )}
        </div>
      </div>

      {commits.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <GitCommit className="w-4 h-4" />
            Recent Commits
          </h2>
          <div className="space-y-2">
            {commits.slice(0, 20).map((commit) => (
              <Link
                key={commit.sha}
                href={`/repositories/${owner}/${repo}/commits/${commit.sha}`}
                className="block border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {commit.commit.message.split('\n')[0].slice(0, 100)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {commit.commit.author.name} &middot; {new Date(commit.commit.author.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {commit.sha.slice(0, 7)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
