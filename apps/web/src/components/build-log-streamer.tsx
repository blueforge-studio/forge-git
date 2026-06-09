'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface LogEntry {
  timestamp: string
  jobId?: string
  level: 'info' | 'warn' | 'error'
  message: string
  details?: unknown[]
}

interface Props {
  jobId: string
}

export default function BuildLogStreamer({ jobId }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const containerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  const appendEntry = useCallback((entry: LogEntry) => {
    setEntries((prev) => [...prev, entry])
  }, [])

  useEffect(() => {
    const url = `/api/builds/${jobId}/logs`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('connected', () => {
      setStatus('connected')
    })

    eventSource.addEventListener('message', (event) => {
      try {
        const entry = JSON.parse(event.data) as LogEntry
        appendEntry(entry)
      } catch {
        // Skip unparseable messages
      }
    })

    eventSource.addEventListener('error', () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setStatus('error')
      }
    })

    return () => {
      eventSource.close()
    }
  }, [jobId, appendEntry])

  // Auto-scroll when new entries arrive (unless user scrolled up)
  useEffect(() => {
    if (!autoScrollRef.current || !containerRef.current) return
    containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [entries])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    // Auto-scroll is on when within 50px of bottom
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
  }, [])

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Build Logs</h2>
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              status === 'connected'
                ? 'bg-green-500'
                : status === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground capitalize">{status}</span>
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} entries</span>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-zinc-950 text-zinc-100 rounded-md p-4 overflow-auto max-h-96 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-zinc-500 py-4 text-center">
            {status === 'connecting' ? 'Connecting to log stream...' : 'Waiting for logs...'}
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                entry.level === 'error'
                  ? 'text-red-400'
                  : entry.level === 'warn'
                    ? 'text-yellow-400'
                    : 'text-zinc-300'
              }`}
            >
              <span className="text-zinc-600 shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
