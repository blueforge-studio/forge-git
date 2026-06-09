import { getSession } from '@/lib/session'
import { listNotifications } from '@forge-git/gitea-bridge'
import type { Notification } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@forge-git/ui'
import EmptyState from '@/components/empty-state'
import NotificationCard from '@/components/notification-card'
import NotificationFilters from '@/components/notification-filters'
import { markAllRead } from './actions'

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function NotificationsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let notifications: Notification[]

  try {
    notifications = await listNotifications({ ...session })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">Notifications</h1>
        <div className="border border-destructive/30 rounded-lg p-8 text-center mt-6">
          <p className="text-sm text-destructive mb-2">Unable to load notifications</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  // Filter by subject type if requested
  const filtered = type
    ? notifications.filter((n) => n.subject.type === type)
    : notifications

  const hasUnread = filtered.some((n) => n.unread)
  const typeCounts: Record<string, number> = {}
  for (const n of notifications) {
    typeCounts[n.subject.type] = (typeCounts[n.subject.type] ?? 0) + 1
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay up to date with activity across your repositories
          </p>
        </div>
        {hasUnread && (
          <form action={markAllRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      <div className="mb-6">
        <NotificationFilters />
      </div>

      {type && (
        <p className="text-xs text-muted-foreground mb-4">
          Showing {filtered.length} of {notifications.length} notifications
          {typeCounts[type] ? ` (${typeCounts[type]} total ${type.toLowerCase()})` : ''}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={type ? `No ${type} notifications` : 'No notifications'}
          description={type ? 'Try a different filter.' : "You're all caught up."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </main>
  )
}
