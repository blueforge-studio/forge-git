import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createPullReview } from '@forge-git/gitea-bridge'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ owner: string; repo: string; number: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { owner, repo, number } = await params
  const prNumber = parseInt(number, 10)

  let body: { body?: string; event?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.event || !['APPROVED', 'REQUEST_CHANGES', 'COMMENT'].includes(body.event)) {
    return NextResponse.json({ error: 'Invalid review event' }, { status: 400 })
  }

  try {
    const review = await createPullReview(owner, repo, prNumber, {
      event: body.event as 'APPROVED' | 'REQUEST_CHANGES' | 'COMMENT',
      body: body.body || '',
    }, session)
    return NextResponse.json(review)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
