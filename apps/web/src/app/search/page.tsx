import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { searchRepos, searchIssues, searchPullRequests } from '@forge-git/gitea-bridge'
import type { GiteaRepo, Issue, PullRequest } from '@forge-git/gitea-bridge'
import RepoCard from '@/components/repo-card'
import EmptyState from '@/components/empty-state'
import { Search, FileText, GitPullRequest } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

const PER_PAGE = 10

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams

  const session = await getSession()
  if (!session) redirect('/login')

  const trimmed = q?.trim()
  if (!trimmed) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <EmptyState
          icon={Search}
          title="Search everything"
          description="Search repositories, issues, and pull requests. Press / to focus the search bar."
        />
      </main>
    )
  }

  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  let repos: GiteaRepo[] = []
  let issues: Issue[] = []
  let pulls: PullRequest[] = []
  let error = ''

  try {
    const [repoResult, issueResult, prResult] = await Promise.all([
      searchRepos(trimmed, { ...session, page, limit: PER_PAGE }),
      searchIssues(trimmed, { ...session, page, limit: PER_PAGE }),
      searchPullRequests(trimmed, { ...session, page, limit: PER_PAGE }),
    ])
    repos = repoResult.data ?? []
    issues = issueResult.data ?? []
    pulls = prResult.data ?? []
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  const total = repos.length + issues.length + pulls.length
  const hasMore = repos.length === PER_PAGE || issues.length === PER_PAGE || pulls.length === PER_PAGE

  // Helper to parse owner/repo from html_url
  function parseFullName(htmlUrl: string): string {
    const parts = htmlUrl.split('/')
    const idx = parts.indexOf('issues') >= 0 ? parts.indexOf('issues') : parts.indexOf('pulls')
    const owner = idx >= 2 ? parts[idx - 2] : ''
    const repoName = idx >= 1 ? parts[idx - 1] : ''
    return owner && repoName ? `${owner}/${repoName}` : ''
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Search results for &ldquo;{trimmed}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} result{total !== 1 ? 's' : ''}
          {repos.length > 0 && ` · ${repos.length} repositor${repos.length === 1 ? 'y' : 'ies'}`}
          {issues.length > 0 && ` · ${issues.length} issue${issues.length === 1 ? '' : 's'}`}
          {pulls.length > 0 && ` · ${pulls.length} pull request${pulls.length === 1 ? '' : 's'}`}
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
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">Issues</h2>
          <ul className="divide-y divide-border border border-border rounded-lg">
            {issues.map((issue) => {
              const fullName = parseFullName(issue.html_url)

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

      {pulls.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-4">Pull Requests</h2>
          <ul className="divide-y divide-border border border-border rounded-lg">
            {pulls.map((pr) => {
              const fullName = parseFullName(pr.html_url)

              return (
                <li key={pr.id}>
                  <Link
                    href={`/repositories/${fullName}/pulls/${pr.number}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <GitPullRequest className={`w-4 h-4 shrink-0 ${
                      pr.merged ? 'text-purple-500' : pr.state === 'open' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className="text-sm font-medium truncate">
                      {pr.title}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border shrink-0 ${
                      pr.merged
                        ? 'border-purple-500/30 text-purple-600 bg-purple-500/10'
                        : pr.state === 'open'
                          ? 'border-green-500/30 text-green-600 bg-green-500/10'
                          : 'border-red-500/30 text-red-600 bg-red-500/10'
                    }`}>
                      {pr.merged ? 'Merged' : pr.state}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      #{pr.number}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!error && repos.length === 0 && issues.length === 0 && pulls.length === 0 && (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No repositories, issues, or pull requests match "${trimmed}"`}
        />
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          {page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(trimmed)}&page=${page - 1}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page}</span>
          {hasMore && (
            <Link
              href={`/search?q=${encodeURIComponent(trimmed)}&page=${page + 1}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
