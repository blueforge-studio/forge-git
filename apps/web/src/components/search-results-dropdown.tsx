'use client'

import { Search, FileText, GitPullRequest, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface QuickResult {
  repos: Array<{ id: number; full_name: string; description?: string }>
  issues: Array<{ id: number; number: number; title: string; html_url: string }>
  pulls: Array<{ id: number; number: number; title: string; state: string; merged: boolean; html_url: string }>
}

function parseFullName(htmlUrl: string): string {
  const parts = htmlUrl.split('/')
  const issuesIdx = parts.indexOf('issues')
  const pullsIdx = parts.indexOf('pulls')
  const idx = issuesIdx >= 0 ? issuesIdx : pullsIdx
  const owner = idx >= 2 ? parts[idx - 2] : ''
  const repo = idx >= 1 ? parts[idx - 1] : ''
  return owner && repo ? `${owner}/${repo}` : ''
}

export default function SearchResultsDropdown({
  results,
  query,
  onSelect,
}: {
  results: QuickResult
  query: string
  onSelect: () => void
}) {
  return (
    <div className="absolute top-full mt-1 right-0 w-96 max-h-96 overflow-auto bg-background border border-border rounded-lg shadow-lg z-50">
      {results.repos.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Repositories</p>
          {results.repos.map((r) => (
            <Link
              key={r.id}
              href={`/repositories/${r.full_name}`}
              onClick={onSelect}
              className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 text-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">{r.full_name}</span>
                {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {results.issues.length > 0 && (
        <div className="p-2 border-t border-border">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Issues</p>
          {results.issues.map((i) => (
            <Link
              key={i.id}
              href={`/repositories/${parseFullName(i.html_url)}/issues/${i.number}`}
              onClick={onSelect}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 text-sm"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{i.title}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-auto">#{i.number}</span>
            </Link>
          ))}
        </div>
      )}

      {results.pulls.length > 0 && (
        <div className="p-2 border-t border-border">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Pull Requests</p>
          {results.pulls.map((p) => (
            <Link
              key={p.id}
              href={`/repositories/${parseFullName(p.html_url)}/pulls/${p.number}`}
              onClick={onSelect}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 text-sm"
            >
              <GitPullRequest className={`w-3.5 h-3.5 shrink-0 ${
                p.merged ? 'text-purple-500' : p.state === 'open' ? 'text-green-500' : 'text-red-500'
              }`} />
              <span className="truncate">{p.title}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-auto">#{p.number}</span>
            </Link>
          ))}
        </div>
      )}

      <Link
        href={`/search?q=${encodeURIComponent(query.trim())}`}
        onClick={onSelect}
        className="block text-center text-xs text-muted-foreground hover:text-foreground py-2 border-t border-border bg-secondary/20"
      >
        See all results &rarr;
      </Link>
    </div>
  )
}
