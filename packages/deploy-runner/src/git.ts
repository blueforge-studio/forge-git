import { access, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { asyncExec, BUILD_DIR_BASE, CLONE_TIMEOUT_MS, GIT_REPO_BASE_URL } from './config'
import { logger } from './logger'

export function buildRepoUrl(orgId: string, repoId: string): string {
  const base = GIT_REPO_BASE_URL.replace(/\/+$/, '')
  return `${base}/${orgId}/${repoId}.git`
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export async function cloneRepository(
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

export async function cleanUp(jobId: string): Promise<void> {
  const workDir = join(BUILD_DIR_BASE, jobId)
  try {
    await rm(workDir, { recursive: true, force: true })
    logger.info(jobId, `Cleaned up build directory: ${workDir}`)
  } catch (err) {
    logger.warn(jobId, `Failed to clean up build directory: ${workDir}`, err)
  }
}
