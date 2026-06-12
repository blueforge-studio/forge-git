import type { Job } from 'bullmq'
import { uploadBuildArtifact } from './minio'
import { asyncExec, STEP_TIMEOUT_MS } from './config'
import { logger } from './logger'
import { cloneRepository, cleanUp, pathExists } from './git'
import type { BuildJob, ParsedWorkflow } from './types'

export async function executeSteps(
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

export async function processBuild(job: Job<BuildJob>) {
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

    const buildLog = JSON.stringify({
      jobId: job.id,
      repo: `${orgId}/${repoId}`,
      commit: commitSha,
      branch,
      completedAt: new Date().toISOString(),
    })

    try {
      const artifactUrl = await uploadBuildArtifact(
        repoId,
        commitSha,
        'build-result.json',
        buildLog,
        'application/json',
      )
      logger.info(job.id, `Artifacts uploaded: ${artifactUrl}`)
    } catch (err) {
      logger.warn(job.id, 'Failed to upload build artifact', err)
    }

    await job.updateProgress(100)
    logger.info(job.id, `Build complete for ${orgId}/${repoId} @ ${commitSha}`)

    return { success: true, repoId: `${orgId}/${repoId}`, commitSha }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(job.id, `Build failed: ${message}`)
    throw err
  } finally {
    if (workDir) await cleanUp(job.id!)
  }
}
