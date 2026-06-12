/**
 * @forge-git/deploy-runner
 *
 * BullMQ worker that processes CI/CD build jobs.
 * Each job: { repoId, orgId, commitSha, branch, prNumber?, workflowYaml? }
 *
 * Call start() to begin processing. Call stop() for graceful shutdown.
 */

import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { CONCURRENCY, REDIS_URL } from './config'
import { logger } from './logger'
import { processBuild } from './processor'
import type { BuildJob } from './types'

let redis: Redis | null = null
let worker: Worker<BuildJob> | null = null

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

export { buildDefaultWorkflow } from './processor'

const runningDirectly =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))

if (runningDirectly) {
  start()
  process.on('SIGTERM', () => void stop())
  process.on('SIGINT', () => void stop())
}
