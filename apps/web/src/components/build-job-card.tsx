'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@forge-git/ui'
import { useState } from 'react'

export interface BuildJob {
  id?: string
  timestamp?: number
  processedOn?: number
  finishedOn?: number
  failedReason?: string
  returnvalue?: unknown
  progress?: unknown
  data: unknown
  state: string
}

function stateBadgeVariant(state: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
  switch (state) {
    case 'active': return 'default'
    case 'completed': return 'success'
    case 'failed': return 'destructive'
    case 'waiting':
    case 'delayed': return 'secondary'
    default: return 'outline'
  }
}

export default function BuildJobCard({ job }: { job: BuildJob }) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const data = job.data as Record<string, unknown>

  async function handleRetry() {
    setActionLoading('retry')
    try {
      await fetch(`/api/builds/${job.id}`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel() {
    setActionLoading('cancel')
    try {
      await fetch(`/api/builds/${job.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/builds/${job.id}`}
              className="font-mono text-sm text-primary hover:underline"
            >
              #{job.id}
            </Link>
            <Badge variant={stateBadgeVariant(job.state)}>{job.state}</Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Repo: <span className="font-mono text-foreground">{String(data.repoId || '-')}</span>
            </span>
            <span>
              Branch: <span className="font-mono text-foreground">{String(data.branch || '-')}</span>
            </span>
            {data.commitSha ? (
              <span>
                Commit:{' '}
                <span className="font-mono text-foreground">
                  {String(data.commitSha).slice(0, 7)}
                </span>
              </span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {job.timestamp ? new Date(job.timestamp).toLocaleString() : 'Unknown date'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {job.state === 'failed' && (
            <Button size="sm" variant="outline" onClick={handleRetry} disabled={actionLoading === 'retry'}>
              {actionLoading === 'retry' ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          {(job.state === 'active' || job.state === 'waiting') && (
            <Button size="sm" variant="destructive" onClick={handleCancel} disabled={actionLoading === 'cancel'}>
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
