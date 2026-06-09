import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createIssueComment } from '@forge-git/gitea-bridge'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { owner, repo, index, body } = await req.json()
  if (!owner || !repo || !index || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const comment = await createIssueComment(owner, repo, index, { body }, session)
    return NextResponse.json(comment)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
