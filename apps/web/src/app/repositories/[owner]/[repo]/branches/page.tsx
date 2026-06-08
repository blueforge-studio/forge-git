import { getSession } from '@/lib/session'
import { listBranches } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { GitBranch, Shield } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function BranchesPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let branches
  try {
    branches = await listBranches(owner, repo, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="branches" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load branches</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="branches" />

      <h2 className="text-lg font-semibold mb-6">Branches</h2>

      {branches.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <GitBranch className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No branches found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((branch) => (
            <Link
              key={branch.name}
              href={`/repositories/${owner}/${repo}/branches/${encodeURIComponent(branch.name)}`}
              className="block border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-sm font-mono">{branch.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {branch.commit.id.slice(0, 7)} &mdash; {branch.commit.message.split('\n')[0].slice(0, 80)}
                    </p>
                  </div>
                </div>
                {branch.protected && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Shield className="w-3 h-3" />
                    Protected
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
