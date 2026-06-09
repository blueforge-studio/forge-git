import {
  listUserRepos,
  listPullRequests,
  searchIssues,
  type GiteaRepo,
  type PullRequest,
  type Issue,
} from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import { deploymentsQueue } from '@/lib/queue'

export interface RecentRepo extends GiteaRepo {
  owner_name: string
}

export interface DashboardBuild {
  id: string
  repo: string
  state: string
  href: string
}

export interface DashboardData {
  repos: RecentRepo[]
  pulls: PullRequest[]
  issues: Issue[]
  builds: DashboardBuild[]
  repoCount: number
  prCount: number
  issueCount: number
  buildCount: number
}

export async function fetchDashboardData(
  session: Session,
): Promise<DashboardData> {
  // Fetch repos and builds in parallel — these are independent
  const [reposResult, buildsResult] = await Promise.allSettled([
    listUserRepos('me', session),
    fetchRecentBuilds(),
  ])

  const repos: RecentRepo[] = reposResult.status === 'fulfilled'
    ? reposResult.value.map((r) => ({ ...r, owner_name: r.owner?.login ?? '' }))
    : []

  const builds: DashboardBuild[] = buildsResult.status === 'fulfilled'
    ? buildsResult.value
    : []

  // Fetch PRs and issues from top repos in parallel
  const topRepos = repos
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const [prsResult, issuesResult] = await Promise.allSettled([
    fetchPRsFromRepos(topRepos, session),
    fetchRecentIssues(session),
  ])

  const pulls: PullRequest[] = prsResult.status === 'fulfilled'
    ? prsResult.value
    : []

  const issues: Issue[] = issuesResult.status === 'fulfilled'
    ? issuesResult.value
    : []

  return {
    repos,
    pulls,
    issues,
    builds,
    repoCount: repos.length,
    prCount: pulls.filter((p) => p.state === 'open').length,
    issueCount: issues.filter((i) => i.state === 'open').length,
    buildCount: builds.length,
  }
}

async function fetchPRsFromRepos(
  repos: RecentRepo[],
  session: Session,
): Promise<PullRequest[]> {
  const results = await Promise.allSettled(
    repos.map((r) =>
      listPullRequests(r.owner_name, r.name, { state: 'open', ...session }),
    ),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<PullRequest[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10)
}

async function fetchRecentIssues(session: Session): Promise<Issue[]> {
  const result = await searchIssues('', { state: 'open', limit: 10, ...session })
  return result.data ?? []
}

async function fetchRecentBuilds(): Promise<DashboardBuild[]> {
  const [active, waiting, completed, failed] = await Promise.allSettled([
    deploymentsQueue.getActive(),
    deploymentsQueue.getWaiting(),
    deploymentsQueue.getCompleted(0, 5),
    deploymentsQueue.getFailed(0, 5),
  ])

  const jobs: Array<{ job: Record<string, unknown>; state: string }> = []

  if (active.status === 'fulfilled')
    jobs.push(...active.value.map((j) => ({ job: j as unknown as Record<string, unknown>, state: 'active' })))
  if (waiting.status === 'fulfilled')
    jobs.push(...waiting.value.map((j) => ({ job: j as unknown as Record<string, unknown>, state: 'waiting' })))
  if (completed.status === 'fulfilled')
    jobs.push(...completed.value.map((j) => ({ job: j as unknown as Record<string, unknown>, state: 'completed' })))
  if (failed.status === 'fulfilled')
    jobs.push(...failed.value.map((j) => ({ job: j as unknown as Record<string, unknown>, state: 'failed' })))

  return jobs
    .sort((a, b) => {
      const aTs = (a.job.timestamp as number) ?? 0
      const bTs = (b.job.timestamp as number) ?? 0
      return bTs - aTs
    })
    .slice(0, 10)
    .map(({ job, state }) => ({
      id: (job.id as string) ?? 'unknown',
      repo: ((job.data as Record<string, unknown>)?.repoId as string) ?? '-',
      state,
      href: `/builds/${(job.id as string) ?? 'unknown'}`,
    }))
}
