import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { deploymentsQueue } from '@/lib/queue'

interface Props {
  params: Promise<{ id: string }>
}

function statusBadge(state: string) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    delayed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[state] || colors.waiting}`}>
      {state}
    </span>
  )
}

export default async function BuildDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let job
  try {
    job = await deploymentsQueue.getJob(id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load build</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  if (!job) notFound()

  const state = await job.getState()
  const progress = job.progress
  const result = job.returnvalue
  const failedReason = job.failedReason
  const data = job.data as Record<string, unknown>

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold font-mono">#{job.id}</h1>
          {statusBadge(state)}
        </div>

        <div className="border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold">Job Data</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24">Repo</dt>
              <dd className="font-mono">{String(data.repoId || '-')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24">Branch</dt>
              <dd className="font-mono">{String(data.branch || '-')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24">Commit</dt>
              <dd className="font-mono text-xs">{String(data.commitSha || '-')}</dd>
            </div>
            {data.prNumber ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-24">PR</dt>
                <dd>#{String(data.prNumber)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {(state === 'active' || state === 'waiting') && (
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-sm font-semibold mb-2">Progress</h2>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${typeof progress === 'number' ? progress : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {typeof progress === 'number' ? `${progress}%` : '0%'}
            </p>
          </div>
        )}

        {state === 'completed' && result && (
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-sm font-semibold mb-2">Result</h2>
            <pre className="text-xs bg-secondary/50 rounded-md p-3 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {state === 'failed' && failedReason && (
          <div className="border border-destructive/30 rounded-lg p-6">
            <h2 className="text-sm font-semibold mb-2 text-destructive">Error</h2>
            <pre className="text-xs text-destructive/80 whitespace-pre-wrap">{failedReason}</pre>
          </div>
        )}

        <div className="border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-2">Timestamps</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28">Created</dt>
              <dd>{job.timestamp ? new Date(job.timestamp).toLocaleString() : '-'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28">Processed</dt>
              <dd>{job.processedOn ? new Date(job.processedOn).toLocaleString() : '-'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28">Finished</dt>
              <dd>{job.finishedOn ? new Date(job.finishedOn).toLocaleString() : '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  )
}
