import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { deploymentsQueue } from '@/lib/queue'
import type { GiteaPushEvent, GiteaPREvent } from '@forge-git/gitea-bridge'

function extractBranch(ref: string): string {
  const prefix = 'refs/heads/'
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : ref
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.GITEA_WEBHOOK_SECRET
  if (!secret) return true
  if (!signatureHeader) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const actual = signatureHeader.replace(/^sha256=/, '')

  if (expected.length !== actual.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const eventType = request.headers.get('X-Gitea-Event')
  const signature = request.headers.get('X-Gitea-Signature')

  if (!verifySignature(rawBody, signature)) {
    console.error('[webhook] Invalid signature')
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
  }

  if (!eventType) {
    console.error('[webhook] Missing X-Gitea-Event header')
    return NextResponse.json({ ok: false, error: 'Missing event type' }, { status: 400 })
  }

  try {
    if (eventType === 'push') {
      const event = JSON.parse(rawBody) as GiteaPushEvent
      const branch = extractBranch(event.ref)
      const orgId = event.repository.owner.login
      const repoId = event.repository.full_name
      const commitSha = event.after

      await deploymentsQueue.add('push-build', { repoId, orgId, commitSha, branch }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })

      console.log(`[webhook] Queued push build: ${repoId} ${branch} ${commitSha.slice(0, 7)}`)
      return NextResponse.json({ ok: true, queued: true, jobType: 'push' })
    }

    if (eventType === 'pull_request') {
      const event = JSON.parse(rawBody) as GiteaPREvent

      if (event.action !== 'opened' && event.action !== 'synchronized') {
        console.log(`[webhook] Ignoring PR action: ${event.action}`)
        return NextResponse.json({ ok: true, ignored: true, reason: `action ${event.action}` })
      }

      const branch = event.pull_request.head.ref
      const orgId = event.repository.owner.login
      const repoId = event.repository.full_name
      const commitSha = event.pull_request.head.sha
      const prNumber = event.number

      await deploymentsQueue.add('pr-build', { repoId, orgId, commitSha, branch, prNumber }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })

      console.log(`[webhook] Queued PR build: ${repoId} #${prNumber} ${commitSha.slice(0, 7)}`)
      return NextResponse.json({ ok: true, queued: true, jobType: 'pr' })
    }

    console.log(`[webhook] Unknown event type: ${eventType}`)
    return NextResponse.json({ ok: true, ignored: true, reason: `unknown: ${eventType}` })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[webhook] Error processing ${eventType} event: ${msg}`)
    return NextResponse.json({ ok: false, error: msg })
  }
}
