import { createOrchestrator } from '@blueforge-studio/comms'
import type { CommsOrchestrator, CommsSeverity, CommsMessage } from '@blueforge-studio/comms'

let orchestrator: CommsOrchestrator | null = null

function getOrchestrator(): CommsOrchestrator {
  if (!orchestrator) {
    orchestrator = createOrchestrator()
  }
  return orchestrator
}

export async function notify(
  subject: string,
  text: string,
  severity: CommsSeverity = 'info',
  metadata?: Record<string, unknown>,
): Promise<void> {
  const message: CommsMessage = {
    subject,
    text,
    severity,
    metadata,
  }

  try {
    await getOrchestrator().route(message)
  } catch {
    console.error('[comms] Failed to route notification:', subject)
  }
}

export async function notifyBuildFailed(params: {
  orgId: string
  repoId: string
  commitSha: string
  branch: string
  error: string
}): Promise<void> {
  await notify(
    `Build failed: ${params.orgId}/${params.repoId}`,
    `Commit \`${params.commitSha.slice(0, 7)}\` on \`${params.branch}\` failed.\n\n${params.error}`,
    'high',
    { orgId: params.orgId, repoId: params.repoId, commit: params.commitSha },
  )
}

export async function notifyBuildSuccess(params: {
  orgId: string
  repoId: string
  commitSha: string
  branch: string
}): Promise<void> {
  await notify(
    `Build passed: ${params.orgId}/${params.repoId}`,
    `Commit \`${params.commitSha.slice(0, 7)}\` on \`${params.branch}\` passed.`,
    'info',
    { orgId: params.orgId, repoId: params.repoId, commit: params.commitSha },
  )
}

export async function notifyPRCreated(params: {
  orgId: string
  repoId: string
  prNumber: number
  title: string
  author: string
}): Promise<void> {
  await notify(
    `PR #${params.prNumber} opened: ${params.title}`,
    `${params.author} opened a pull request in ${params.orgId}/${params.repoId}: ${params.title}`,
    'medium',
    params,
  )
}
