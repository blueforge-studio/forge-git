import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { searchRepos, searchIssues } from '@forge-git/gitea-bridge'
import type { GiteaRepo, Issue } from '@forge-git/gitea-bridge'
import RepoCard from '@/components/repo-card'
import EmptyState from '@/components/empty-state'
import { Search, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams

  const session = await getSession()
  if (!session) redirect('/login')

  const trimmed = q?.trim()
  if (!trimmed) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <EmptyState
          icon={Search}
          title="Search everything"
          description="Search repositories, issues, and pull requests"
        />
      </main>
    )
  }

  let repos: GiteaRepo[] = []
  let issues: Issue[] = []
  let error = ''

  try {
    const [repoResult, issueResult] = await Promise.all([
      searchRepos(trimmed, session),
      searchIssues(trimmed, session),
    ])
    repos = repoResult.data ?? []
    issues = issueResult.data ?? []
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Search results for &ldquo;{trimmed}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {repos.length + issues.length} result{repos.length + issues.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="border border-destructive/30 rounded-lg p-8 text-center mb-8">
          <p className="text-sm text-destructive mb-2">Search failed</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      )}

      {repos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">Repositories</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">Issues</h2>
          <ul className="divide-y divide-border border border-border rounded-lg">
            {issues.map((issue) => {
              const parts = issue.html_url.split('/')
              const idx = parts.indexOf('issues')
              const owner = idx >= 2 ? parts[idx - 2] : ''
              const repoName = idx >= 1 ? parts[idx - 1] : ''
              const fullName = owner && repoName ? `${owner}/${repoName}` : ''

              return (
                <li key={issue.id}>
                  <Link
                    href={`/repositories/${fullName}/issues/${issue.number}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {issue.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                      #{issue.number}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!error && repos.length === 0 && issues.length === 0 && (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No repositories or issues match "${trimmed}"`}
        />
      )}
    </main>
  )
}
