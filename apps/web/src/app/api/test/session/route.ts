import { createSession, clearSession } from '@/lib/session'
import { deploymentsQueue } from '@/lib/queue'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  let body: { baseUrl?: string; token?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action === 'clear') {
    await clearSession()
    return NextResponse.json({ ok: true })
  }

  const baseUrl = body.baseUrl ?? 'http://localhost:3099'
  const token = body.token ?? 'mock-token'

  await createSession(baseUrl, token)

  // Test-mode convenience: the `mock-token-empty-all` token signals that
  // the caller wants every backing store (Gitea + build queue) to appear
  // empty. Flush the BullMQ deployments queue so the /builds page renders
  // its first-run state instead of a populated job list.
  if (token === 'mock-token-empty-all') {
    try {
      await deploymentsQueue.obliterate({ force: true })
    } catch {
      // Non-fatal: if Redis is unavailable the page falls through to its
      // existing redisError branch, which is the correct UX.
    }
  }

  return NextResponse.json({ ok: true, baseUrl, token })
}
