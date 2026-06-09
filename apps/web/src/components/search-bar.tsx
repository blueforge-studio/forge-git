'use client'

import { Search, FileText, GitPullRequest, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@forge-git/ui'
import { type FormEvent, useState, useEffect, useRef, useCallback } from 'react'

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

let debounceTimer: ReturnType<typeof setTimeout>

export default function SearchBar() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuickResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Keyboard shortcut: / to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json() as QuickResult
        setResults(data)
        setOpen(true)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchResults(value.trim()), 250)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setOpen(false)
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function handleSelect() {
    setOpen(false)
    setQuery('')
    setResults(null)
  }

  const hasResults = results && (results.repos.length > 0 || results.issues.length > 0 || results.pulls.length > 0)

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder='Search... (press "/")'
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results && hasResults) setOpen(true) }}
          className="w-44 focus:w-64 pl-8 h-8 text-sm transition-all"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        )}
      </form>

      {/* Quick-results dropdown */}
      {open && hasResults && (
        <div className="absolute top-full mt-1 right-0 w-96 max-h-96 overflow-auto bg-background border border-border rounded-lg shadow-lg z-50">
          {results!.repos.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Repositories</p>
              {results!.repos.map((r) => (
                <Link
                  key={r.id}
                  href={`/repositories/${r.full_name}`}
                  onClick={handleSelect}
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

          {results!.issues.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Issues</p>
              {results!.issues.map((i) => (
                <Link
                  key={i.id}
                  href={`/repositories/${parseFullName(i.html_url)}/issues/${i.number}`}
                  onClick={handleSelect}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 text-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{i.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-auto">#{i.number}</span>
                </Link>
              ))}
            </div>
          )}

          {results!.pulls.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Pull Requests</p>
              {results!.pulls.map((p) => (
                <Link
                  key={p.id}
                  href={`/repositories/${parseFullName(p.html_url)}/pulls/${p.number}`}
                  onClick={handleSelect}
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
            onClick={handleSelect}
            className="block text-center text-xs text-muted-foreground hover:text-foreground py-2 border-t border-border bg-secondary/20"
          >
            See all results &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
