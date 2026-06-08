/**
 * @forge-git/deploy-runner
 *
 * BullMQ worker that processes CI/CD build jobs.
 * Each job: { repoId, commitSha, branch, prNumber?, workflowYaml? }
 *
 * Call start() to begin processing. Call stop() for graceful shutdown.
 */

import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '2')

interface BuildJob {
  repoId: string
  orgId: string
  commitSha: string
  branch: string
  prNumber?: number
  workflowYaml?: string
}

async function processBuild(job: Job<BuildJob>) {
  const { repoId, commitSha, branch, prNumber, workflowYaml } = job.data

  await job.updateProgress(10)

  // 1. Clone repository at commit SHA
  console.log(`[${job.id}] Cloning repo ${repoId} at ${commitSha}...`)
  // TODO: Implement git clone with shallow checkout
  await job.updateProgress(30)

  // 2. Parse workflow YAML (or use default)
  const workflow = workflowYaml ?? buildDefaultWorkflow()
  console.log(`[${job.id}] Running workflow: ${workflow.name}`)
  await job.updateProgress(50)

  // 3. Execute build steps in Docker
  for (const step of workflow.jobs.test.steps) {
    if (step.run) {
      console.log(`[${job.id}] Running: ${step.run}`)
      // TODO: docker run --rm -w <workdir> <image> sh -c "<command>"
    }
    if (step.uses) {
      console.log(`[${job.id}] Using action: ${step.uses}`)
      // TODO: resolve action (checkout, setup-node, etc.)
    }
  }

  await job.updateProgress(80)

  // 4. Upload artifacts to MinIO
  console.log(`[${job.id}] Uploading artifacts...`)
  // TODO: minio client.putObject()

  await job.updateProgress(100)
  console.log(`[${job.id}] Build complete!`)

  return { success: true, artifactUrl: `https://minio.local/repos/${repoId}/${commitSha}` }
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

function buildDefaultWorkflow(): ParsedWorkflow {
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

let redis: Redis | null = null
let worker: Worker<BuildJob> | null = null

export function start() {
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null })

  worker = new Worker<BuildJob>(
    'deployments',
    async (job) => processBuild(job),
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`[${job.id}] Completed:`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[${job?.id}] Failed:`, err.message)
  })

  console.log(`forge-git deploy-runner started (concurrency: ${CONCURRENCY})`)
}

export async function stop() {
  if (worker) await worker.close()
  if (redis) redis.quit()
}

// Auto-start when run directly (not imported)
const runningDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (runningDirectly) {
  start()
  process.on('SIGTERM', () => stop())
  process.on('SIGINT', () => stop())
}
