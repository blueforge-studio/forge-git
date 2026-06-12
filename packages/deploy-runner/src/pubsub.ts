import Redis from 'ioredis'
import { REDIS_URL } from './config'

let pubClient: Redis | null = null

export function getPubClient(): Redis {
  if (!pubClient) {
    pubClient = new Redis(REDIS_URL)
  }
  return pubClient
}

export function publishLog(jobId: string, entry: Record<string, unknown>): void {
  try {
    getPubClient().publish(`build:${jobId}:logs`, JSON.stringify(entry))
  } catch {
    // Best-effort — don't fail the build if pub/sub is unavailable
  }
}
