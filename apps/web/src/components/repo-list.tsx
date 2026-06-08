import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import RepoCard from './repo-card'
import EmptyState from './empty-state'
import { Server } from 'lucide-react'

export default async function RepoList({ session }: { session: Session }) {
  let repos
  try {
    repos = await listUserRepos('me', session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="border border-destructive/30 rounded-lg p-8 text-center">
        <p className="text-sm text-destructive mb-2">
          Unable to load repositories
        </p>
        <p className="text-xs text-muted-foreground">{msg}</p>
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title="No repositories yet"
        description="Create your first repository to start hosting with forge-git"
        actionLabel="Create Repository"
        actionHref="/repositories/new"
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  )
}
