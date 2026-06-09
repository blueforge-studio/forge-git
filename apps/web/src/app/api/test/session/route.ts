import { createSession, clearSession } from '@/lib/session'
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

  return NextResponse.json({ ok: true, baseUrl, token })
}
