import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { deploymentsQueue } from '@/lib/queue'
import BuildsList from '@/components/builds-list'
import TriggerBuildForm from '@/components/trigger-build-form'
import BuildsPolling from '@/components/builds-polling'
import { Box, BookOpen, GitBranch, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@forge-git/ui'
import { getTranslations } from 'next-intl/server'
import FirstRunEmptyState from '@/components/first-run-empty-state'

async function getJobs() {
  const [completed, failed, waiting, active] = await Promise.all([
    deploymentsQueue.getJobs(['completed'], 0, 49),
    deploymentsQueue.getJobs(['failed'], 0, 49),
    deploymentsQueue.getJobs(['waiting'], 0, 49),
    deploymentsQueue.getJobs(['active'], 0, 49),
  ])

  // Map to a clean serializable shape — BullMQ's toJSON() includes a
  // bound `toKey` function on the result, which React cannot pass across
  // the server/client boundary.
  const toClean = (j: (typeof completed)[number]) => ({
    id: j.id,
    timestamp: j.timestamp,
    processedOn: j.processedOn,
    finishedOn: j.finishedOn,
    failedReason: j.failedReason,
    returnvalue: j.returnvalue,
    progress: j.progress,
    data: j.data,
  })

  const all: Array<{ id?: string; timestamp?: number; data: unknown; state: string }> = [
    ...active.map((j) => ({ ...toClean(j), state: 'active' as const })),
    ...waiting.map((j) => ({ ...toClean(j), state: 'waiting' as const })),
    ...completed.map((j) => ({ ...toClean(j), state: 'completed' as const })),
    ...failed.map((j) => ({ ...toClean(j), state: 'failed' as const })),
  ]

  return all
    .filter((j) => j.id)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
}

interface Props {
  searchParams: Promise<{ repo?: string }>
}

async function BuildsFirstRun() {
  const t = await getTranslations('builds.firstRun')
  return (
    <FirstRunEmptyState
      icon={Box}
      namespace="builds.firstRun"
      primaryCta={
        <Button asChild className="w-full h-11 btn-glow">
          <Link
            href="/repositories"
            data-testid="builds-first-run-primary-cta"
            className="group inline-flex items-center justify-center gap-2"
          >
            {t('primaryCta')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      }
      secondaryCards={
        <>
          <SecondaryCard
            href="https://docs.gitea.com/usage/actions/overview"
            icon={BookOpen}
            title={t('secondaryLearnTitle')}
            description={t('secondaryLearnDesc')}
            testId="builds-first-run-secondary-learn"
            external
          />
          <SecondaryCard
            href="/repositories"
            icon={GitBranch}
            title={t('secondaryBrowseTitle')}
            description={t('secondaryBrowseDesc')}
            testId="builds-first-run-secondary-browse"
          />
        </>
      }
    />
  )
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
          {jobs && jobs.length === 0 ? (
            <BuildsFirstRun />
          ) : (
            <BuildsList jobs={jobs!} />
          )}
        </>
      )}
    </main>
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof Box
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
