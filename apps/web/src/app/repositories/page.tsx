import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@forge-git/ui'
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
            Your repositories on {session.baseUrl}
          </p>
        </div>
        <Button asChild>
          <Link href="/repositories/new">New Repository</Link>
        </Button>
      </div>

      <RepoList session={session} />
    </main>
  )
}
