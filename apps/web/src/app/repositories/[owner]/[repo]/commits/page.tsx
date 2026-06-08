import { getSession } from '@/lib/session'
import { listCommits } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { GitCommit } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function CommitsPage({ params, searchParams }: Props) {
  const { owner, repo } = await params
  const { ref } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let commits
  try {
    commits = await listCommits(owner, repo, { ref, ...session })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="commits" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load commits</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="commits" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">
          {ref ? `Commits on ${ref}` : 'Commits'}
        </h2>
      </div>

      {commits.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <GitCommit className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No commits found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commits.map((commit) => (
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
                    {commit.commit.author.name} committed on {new Date(commit.commit.author.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-muted-foreground">
                    {commit.sha.slice(0, 7)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
