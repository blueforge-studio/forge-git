import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listNotifications } from '@forge-git/gitea-bridge'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ count: 0 })

  try {
    const notifications = await listNotifications({ unread: true, limit: 1, ...session })
    return NextResponse.json({ count: notifications.length })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
