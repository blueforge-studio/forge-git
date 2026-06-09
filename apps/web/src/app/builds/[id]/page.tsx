import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { deploymentsQueue } from '@/lib/queue'
import { Badge, Button } from '@forge-git/ui'
import BuildLogViewer from '@/components/build-log-viewer'
import BuildLogStreamer from '@/components/build-log-streamer'
import BuildArtifactList from '@/components/build-artifact-list'
import JobTimestamps from '@/components/job-timestamps'
import Link from 'next/link'
import { retryJobAction, cancelJobAction } from './actions'
import { stateBadgeVariant } from '@/lib/build-utils'
import { listBuildArtifacts } from '@/lib/minio'

interface Props {
  params: Promise<{ id: string }>
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

  const logsToShow = result
    ? typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    : failedReason || undefined

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="space-y-6">
        <Link
          href="/builds"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to builds
        </Link>

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold font-mono">#{job.id}</h1>
          <Badge variant={stateBadgeVariant(state)}>{state}</Badge>
        </div>

        <div className="border border-border rounded-lg p-6 space-y-3">
          <h2 className="text-sm font-semibold">Job Data</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24 shrink-0">Repo</dt>
              <dd className="font-mono">{String(data.repoId || '-')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24 shrink-0">Branch</dt>
              <dd className="font-mono">{String(data.branch || '-')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-24 shrink-0">Commit</dt>
              <dd className="font-mono text-xs">{String(data.commitSha || '-')}</dd>
            </div>
            {data.prNumber ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-24 shrink-0">PR</dt>
                <dd>#{String(data.prNumber)}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {(state === 'active' || state === 'waiting') && (
          <>
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
            <BuildLogStreamer jobId={id} />
          </>
        )}

        {(state === 'completed' || state === 'failed') && logsToShow && (
          <BuildLogViewer
            logs={logsToShow}
            title={state === 'failed' ? 'Error' : 'Result'}
          />
        )}

        <BuildArtifactsSection
          repoId={String(data.repoId || '')}
          commitSha={String(data.commitSha || '')}
        />

        <JobTimestamps
          timestamp={job.timestamp}
          processedOn={job.processedOn}
          finishedOn={job.finishedOn}
        />

        <div className="flex items-center gap-3 pt-2">
          {state === 'failed' && (
            <form action={retryJobAction.bind(null, id)}>
              <Button type="submit" variant="outline" size="sm">Retry Build</Button>
            </form>
          )}
          {(state === 'active' || state === 'waiting') && (
            <form action={cancelJobAction.bind(null, id)}>
              <Button type="submit" variant="destructive" size="sm">Cancel Build</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

async function BuildArtifactsSection({
  repoId,
  commitSha,
}: {
  repoId: string
  commitSha: string
}) {
  if (!repoId || !commitSha) return null

  try {
    const artifacts = await listBuildArtifacts(repoId, commitSha)
    return <BuildArtifactList artifacts={artifacts} available />
  } catch {
    return <BuildArtifactList artifacts={[]} available={false} />
  }
}
