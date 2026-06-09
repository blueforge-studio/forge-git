import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { searchRepos, searchIssues, searchPullRequests } from '@forge-git/gitea-bridge'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ repos: [], issues: [], pulls: [] })

  try {
    const [repoResult, issueResult, prResult] = await Promise.all([
      searchRepos(q, { ...session, limit: 3 }),
      searchIssues(q, { ...session, limit: 3 }),
      searchPullRequests(q, { ...session, limit: 3 }),
    ])

    return NextResponse.json({
      repos: (repoResult.data ?? []).map((r) => ({ id: r.id, full_name: r.full_name, description: r.description })),
      issues: (issueResult.data ?? []).map((i) => ({ id: i.id, number: i.number, title: i.title, html_url: i.html_url })),
      pulls: (prResult.data ?? []).map((p) => ({ id: p.id, number: p.number, title: p.title, state: p.state, merged: p.merged, html_url: p.html_url })),
    })
  } catch {
    return NextResponse.json({ repos: [], issues: [], pulls: [] })
  }
}
