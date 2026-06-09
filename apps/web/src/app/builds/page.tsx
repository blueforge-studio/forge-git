import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { deploymentsQueue } from '@/lib/queue'
import BuildsList from '@/components/builds-list'
import TriggerBuildForm from '@/components/trigger-build-form'
import BuildsPolling from '@/components/builds-polling'

async function getJobs() {
  const [completed, failed, waiting, active] = await Promise.all([
    deploymentsQueue.getJobs(['completed'], 0, 49),
    deploymentsQueue.getJobs(['failed'], 0, 49),
    deploymentsQueue.getJobs(['waiting'], 0, 49),
    deploymentsQueue.getJobs(['active'], 0, 49),
  ])

  const all: Array<{ id?: string; timestamp?: number; data: unknown; state: string }> = [
    ...active.map((j) => ({ ...j.toJSON(), state: 'active' as const })),
    ...waiting.map((j) => ({ ...j.toJSON(), state: 'waiting' as const })),
    ...completed.map((j) => ({ ...j.toJSON(), state: 'completed' as const })),
    ...failed.map((j) => ({ ...j.toJSON(), state: 'failed' as const })),
  ]

  return all
    .filter((j) => j.id)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
}

interface Props {
  searchParams: Promise<{ repo?: string }>
}

export default async function BuildsPage({ searchParams }: Props) {
  const { repo: repoFilter } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let jobs
  let redisError = ''
  try {
    jobs = await getJobs()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
      redisError = 'Redis is not running. Start Docker Compose to enable build tracking.'
    } else {
      redisError = msg
    }
  }

  if (jobs && repoFilter) {
    jobs = jobs.filter((j) => {
      const data = j.data as { repoId?: string } | undefined
      return data?.repoId === repoFilter
    })
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {!redisError && <BuildsPolling />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Builds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {repoFilter ? `Builds for ${repoFilter}` : 'CI/CD build and deployment history'}
          </p>
        </div>
      </div>

      {redisError ? (
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to connect to build queue</p>
          <p className="text-xs text-muted-foreground">{redisError}</p>
        </div>
      ) : (
        <>
          <details className="mb-6 border border-border rounded-lg">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-secondary/30">
              Trigger Manual Build
            </summary>
            <TriggerBuildForm />
          </details>
          <BuildsList jobs={jobs!} />
        </>
      )}
    </main>
  )
}
