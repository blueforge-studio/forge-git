import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listMembers, getDb, getOrgByName } from '@forge-git/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name } = await params

  try {
    const org = await getOrgByName(getDb(), name)
    if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const members = await listMembers(getDb(), name)
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 500 })
  }
}
