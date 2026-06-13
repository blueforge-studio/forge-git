import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listOrgs, getDb } from '@forge-git/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const orgs = await listOrgs(getDb())
    return NextResponse.json({ orgs })
  } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 500 })
  }
}
