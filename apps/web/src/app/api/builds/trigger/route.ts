import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deploymentsQueue, type BuildJobData } from '@/lib/queue'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Partial<BuildJobData>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.repoId || !body.commitSha || !body.branch) {
    return NextResponse.json(
      { error: 'Missing required fields: repoId, commitSha, branch' },
      { status: 400 }
    )
  }

  try {
    const job = await deploymentsQueue.add('build', {
      repoId: body.repoId,
      orgId: body.orgId || '',
      commitSha: body.commitSha,
      branch: body.branch,
      prNumber: body.prNumber,
      workflowYaml: body.workflowYaml,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })

    return NextResponse.json({ jobId: job.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to enqueue build: ${msg}` }, { status: 500 })
  }
}
