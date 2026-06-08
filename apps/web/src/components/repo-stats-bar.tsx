import { GitFork, Star, Eye, AlertCircle, GitPullRequest } from 'lucide-react'

interface Props {
  language?: string
  stars_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  open_pr_counter: number
}

export default function RepoStatsBar(stats: Props) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
      {stats.language && (
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary" />
          {stats.language}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Star className="w-4 h-4" /> {stats.stars_count} stars
      </span>
      <span className="flex items-center gap-1">
        <GitFork className="w-4 h-4" /> {stats.forks_count} forks
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-4 h-4" /> {stats.watchers_count} watchers
      </span>
      <span className="flex items-center gap-1">
        <AlertCircle className="w-4 h-4" /> {stats.open_issues_count} issues
      </span>
      <span className="flex items-center gap-1">
        <GitPullRequest className="w-4 h-4" /> {stats.open_pr_counter} PRs
      </span>
    </div>
  )
}
