import { exec } from 'node:child_process'
import { promisify } from 'node:util'

export const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
export const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '2', 10)
export const GIT_REPO_BASE_URL = process.env.GIT_REPO_BASE_URL ?? 'https://gitea.local'
export const BUILD_DIR_BASE = '/tmp/forge-git-builds'
export const STEP_TIMEOUT_MS = 10 * 60 * 1000
export const CLONE_TIMEOUT_MS = 5 * 60 * 1000

export const asyncExec = promisify(exec)
