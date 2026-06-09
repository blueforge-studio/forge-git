/**
 * @forge-git/deploy-runner
 *
 * BullMQ worker that processes CI/CD build jobs.
 * Each job: { repoId, orgId, commitSha, branch, prNumber?, workflowYaml? }
 *
 * Call start() to begin processing. Call stop() for graceful shutdown.
 */

import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { access, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '2', 10)
const GIT_REPO_BASE_URL = process.env.GIT_REPO_BASE_URL ?? 'https://gitea.local'
const BUILD_DIR_BASE = '/tmp/forge-git-builds'
const STEP_TIMEOUT_MS = 10 * 60 * 1000
const CLONE_TIMEOUT_MS = 5 * 60 * 1000

const asyncExec = promisify(exec)

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, jobId: string | undefined, message: string, ...args: unknown[]): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    jobId,
    level,
    message,
  }
  if (args.length > 0) entry.details = args
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.log(output)
}

const logger = {
  info: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('info', jobId, message, ...args),
  warn: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('warn', jobId, message, ...args),
  error: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('error', jobId, message, ...args),
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuildJob {
  repoId: string
  orgId: string
  commitSha: string
  branch: string
  prNumber?: number
  workflowYaml?: ParsedWorkflow
}

interface ParsedWorkflow {
  name: string
  jobs: {
    test: {
      runs_on: string
      steps: Array<{ run?: string; uses?: string; with?: Record<string, string> }>
    }
  }
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function buildRepoUrl(orgId: string, repoId: string): string {
  const base = GIT_REPO_BASE_URL.replace(/\/+$/, '')
  return `${base}/${orgId}/${repoId}.git`
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function cloneRepository(
  jobId: string,
  orgId: string,
  repoId: string,
  commitSha: string,
  branch: string,
): Promise<string> {
  const workDir = join(BUILD_DIR_BASE, jobId)
  const repoUrl = buildRepoUrl(orgId, repoId)

  await rm(workDir, { recursive: true, force: true })
  await mkdir(BUILD_DIR_BASE, { recursive: true })

  logger.info(jobId, `Cloning ${orgId}/${repoId} @ ${commitSha} (branch: ${branch})`)

  await asyncExec(`git clone --depth 1 --branch ${branch} ${repoUrl} ${workDir}`, {
    timeout: CLONE_TIMEOUT_MS,
  })

  await asyncExec(`git checkout ${commitSha}`, {
    cwd: workDir,
    timeout: CLONE_TIMEOUT_MS,
  })

  logger.info(jobId, `Clone complete: ${workDir}`)
  return workDir
}

async function cleanUp(jobId: string): Promise<void> {
  const workDir = join(BUILD_DIR_BASE, jobId)
  try {
    await rm(workDir, { recursive: true, force: true })
    logger.info(jobId, `Cleaned up build directory: ${workDir}`)
  } catch (err) {
    logger.warn(jobId, `Failed to clean up build directory: ${workDir}`, err)
  }
}

// ---------------------------------------------------------------------------
// Step execution
// ---------------------------------------------------------------------------

async function executeSteps(
  steps: ParsedWorkflow['jobs']['test']['steps'],
  workDir: string,
  jobId: string,
): Promise<void> {
  for (const [index, step] of steps.entries()) {
    if (step.uses === 'actions/checkout@v4') {
      const exists = await pathExists(workDir)
      if (!exists) {
        throw new Error(`Checkout step (${index}) failed: working directory ${workDir} does not exist`)
      }
      logger.info(jobId, `Checkout verified: ${workDir}`)
      continue
    }

    if (step.uses) {
      logger.warn(jobId, `Unsupported action: ${step.uses} (step ${index}) — skipping`)
      continue
    }

    if (step.run) {
      logger.info(jobId, `Running step ${index}: ${step.run}`)
      const { stdout, stderr } = await asyncExec(step.run, {
        cwd: workDir,
        timeout: STEP_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      })
      if (stdout) logger.info(jobId, `Step ${index} stdout:\n${stdout.replace(/\n$/, '')}`)
      if (stderr) logger.warn(jobId, `Step ${index} stderr:\n${stderr.replace(/\n$/, '')}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Build processing
// ---------------------------------------------------------------------------

async function processBuild(job: Job<BuildJob>) {
  const { repoId, orgId, commitSha, branch, workflowYaml } = job.data
  let workDir: string | undefined

  try {
    logger.info(job.id, `Processing build for ${orgId}/${repoId} @ ${commitSha}`)
    await job.updateProgress(10)

    workDir = await cloneRepository(job.id!, orgId, repoId, commitSha, branch)
    await job.updateProgress(30)

    const workflow: ParsedWorkflow = workflowYaml ?? buildDefaultWorkflow()
    logger.info(job.id, `Running workflow: ${workflow.name}`)
    await job.updateProgress(50)

    await executeSteps(workflow.jobs.test.steps, workDir, job.id!)
    await job.updateProgress(80)

    logger.info(job.id, 'Uploading artifacts...')
    // TODO: minio client.putObject()

    await job.updateProgress(100)
    logger.info(job.id, `Build complete for ${orgId}/${repoId} @ ${commitSha}`)

    return {
      success: true,
      artifactUrl: `https://minio.local/repos/${repoId}/${commitSha}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(job.id, `Build failed: ${message}`)
    throw err
  } finally {
    if (workDir) await cleanUp(job.id!)
  }
}

// ---------------------------------------------------------------------------
// Default workflow
// ---------------------------------------------------------------------------

export function buildDefaultWorkflow(): ParsedWorkflow {
  return {
    name: 'CI',
    jobs: {
      test: {
        runs_on: 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          { run: 'npm ci && npm test' },
        ],
      },
    },
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let redis: Redis | null = null
let worker: Worker<BuildJob> | null = null

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function start(): void {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null })

  worker = new Worker<BuildJob>(
    'deployments',
    async (job) => processBuild(job),
    {
      connection: redis,
      concurrency: CONCURRENCY,
    },
  )

  worker.on('completed', (job, result) => {
    logger.info(job.id, `Completed: ${JSON.stringify(result)}`)
  })

  worker.on('failed', (job, err) => {
    logger.error(job?.id, `Failed: ${err.message}`)
  })

  logger.info(undefined, `Deploy runner started (concurrency: ${CONCURRENCY})`)
}

export async function stop(): Promise<void> {
  if (worker) {
    await worker.close()
    worker = null
  }
  if (redis) {
    redis.quit()
    redis = null
  }
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function health(): Promise<{
  status: 'ok' | 'error'
  redis: boolean
  workerRunning: boolean
}> {
  let redisOk = false
  try {
    if (redis) {
      await redis.ping()
      redisOk = true
    }
  } catch {
    // Redis not reachable
  }

  return {
    status: redisOk && worker !== null ? 'ok' : 'error',
    redis: redisOk,
    workerRunning: worker !== null,
  }
}

// ---------------------------------------------------------------------------
// Auto-start
// ---------------------------------------------------------------------------

const runningDirectly =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))

if (runningDirectly) {
  start()
  process.on('SIGTERM', () => void stop())
  process.on('SIGINT', () => void stop())
}
