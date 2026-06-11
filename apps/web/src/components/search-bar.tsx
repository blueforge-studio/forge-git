'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@forge-git/ui'
import { type FormEvent, useState, useEffect, useRef, useCallback } from 'react'
import SearchResultsDropdown from './search-results-dropdown'

interface QuickResult {
  repos: Array<{ id: number; full_name: string; description?: string }>
  issues: Array<{ id: number; number: number; title: string; html_url: string }>
  pulls: Array<{ id: number; number: number; title: string; state: string; merged: boolean; html_url: string }>
}

let debounceTimer: ReturnType<typeof setTimeout>

export default function SearchBar({ placeholder = 'Search... (press "/")' }: { placeholder?: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuickResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Keyboard shortcut: / to focus, Escape to dismiss
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
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results && hasResults) setOpen(true) }}
          className="w-44 focus:w-64 pl-8 h-8 text-sm transition-all"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        )}
      </form>

      {open && hasResults && (
        <SearchResultsDropdown
          results={results!}
          query={query}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
