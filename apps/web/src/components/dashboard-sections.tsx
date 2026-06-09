import type { GiteaRepo, PullRequest, Issue } from '@forge-git/gitea-bridge'
import Link from 'next/link'

interface RecentRepo extends GiteaRepo {
  owner_name: string
}

interface RecentItem {
  title: string
  subtitle: string
  href: string
  badge?: string
}

function RecentList({ items, emptyText }: { items: RecentItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors"
          >
            <span className="flex-1 truncate">{item.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">{item.subtitle}</span>
            {item.badge && (
              <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

interface Props {
  repos: RecentRepo[]
  pulls: PullRequest[]
  issues: Issue[]
  builds: Array<{ id: string; repo: string; state: string; href: string }>
}

export default function DashboardSections({ repos, pulls, issues, builds }: Props) {
  const repoItems: RecentItem[] = repos.map((r) => ({
    title: r.full_name,
    subtitle: `${r.stars_count ?? 0} stars`,
    href: `/repositories/${r.owner_name}/${r.name}`,
  }))

  const pullItems: RecentItem[] = pulls.slice(0, 5).map((pr) => {
    // parse owner/repo from html_url: ".../owner/repo/pulls/N"
    const parts = pr.html_url.split('/')
    const pullsIdx = parts.indexOf('pulls')
    const prOwner = pullsIdx >= 2 ? parts[pullsIdx - 2] : ''
    const prRepo = pullsIdx >= 1 ? parts[pullsIdx - 1] : ''
    return {
      title: pr.title,
      subtitle: `#${pr.number}`,
      href: prOwner && prRepo ? `/repositories/${prOwner}/${prRepo}/pulls/${pr.number}` : '#',
      badge: pr.state,
    }
  })

  const issueItems: RecentItem[] = issues.slice(0, 5).map((issue) => {
    const parts = issue.html_url.split('/')
    const issuesIdx = parts.indexOf('issues')
    const issueOwner = issuesIdx >= 2 ? parts[issuesIdx - 2] : ''
    const issueRepo = issuesIdx >= 1 ? parts[issuesIdx - 1] : ''
    return {
      title: issue.title,
      subtitle: `#${issue.number}`,
      href: issueOwner && issueRepo ? `/repositories/${issueOwner}/${issueRepo}/issues/${issue.number}` : '#',
      badge: issue.state,
    }
  })

  const buildItems: RecentItem[] = builds.map((b) => ({
    title: `${b.repo} — Build #${b.id}`,
    subtitle: b.state,
    href: b.href,
    badge: b.state,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Repositories</h3>
        <RecentList items={repoItems} emptyText="No repositories yet." />
      </div>
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Pull Requests</h3>
        <RecentList items={pullItems} emptyText="No pull requests yet." />
      </div>
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Issues</h3>
        <RecentList items={issueItems} emptyText="No issues yet." />
      </div>
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Builds</h3>
        <RecentList items={buildItems} emptyText="No builds yet." />
      </div>
    </div>
  )
}
