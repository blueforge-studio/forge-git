import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoList from '@/components/repo-list'

export default async function RepositoriesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your repositories on {session.giteaUrl}
          </p>
        </div>
        <Link
          href="/repositories/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          New Repository
        </Link>
      </div>

      <RepoList session={session} />
    </main>
  )
}
