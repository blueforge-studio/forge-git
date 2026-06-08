import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deploymentsQueue } from '@/lib/queue'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const job = await deploymentsQueue.getJob(id)
    if (!job) {
      return NextResponse.json({ error: 'Build job not found' }, { status: 404 })
    }

    const state = await job.getState()
    if (state !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      )
    }

    await job.retry()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to retry build: ${msg}` }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const job = await deploymentsQueue.getJob(id)
    if (!job) {
      return NextResponse.json({ error: 'Build job not found' }, { status: 404 })
    }

    await job.remove()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to cancel build: ${msg}` }, { status: 500 })
  }
}
