import { Queue } from 'bullmq'
import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

let connection: Redis | null = null
function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null })
  }
  return connection
}

export const deploymentsQueue = new Queue('deployments', {
  connection: getConnection(),
})

export interface BuildJobData {
  repoId: string
  orgId: string
  commitSha: string
  branch: string
  prNumber?: number
  workflowYaml?: string
}
