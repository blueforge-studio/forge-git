import { getSession } from '@/lib/session'
import { listNotifications } from '@forge-git/gitea-bridge'
import type { Notification } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button, Badge } from '@forge-git/ui'
import EmptyState from '@/components/empty-state'
import { markRead, markAllRead } from './actions'

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function typeBadgeVariant(type: string): 'default' | 'secondary' | 'success' | 'outline' {
  switch (type) {
    case 'Issue': return 'default'
    case 'PullRequest':
    case 'Pull': return 'success'
    case 'Commit': return 'secondary'
    default: return 'outline'
  }
}

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let notifications: Notification[]

  try {
    notifications = await listNotifications({ unread: false, ...session })
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

  const hasUnread = notifications.some((n) => n.unread)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
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

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border rounded-lg p-4 transition-colors ${
                n.unread ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/repositories/${n.repository.full_name}`}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {n.repository.full_name}
                  </Link>
                  <p className={`mt-0.5 truncate ${n.unread ? 'font-medium' : ''}`}>
                    {n.subject.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={typeBadgeVariant(n.subject.type)}>
                    {n.subject.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(n.updated_at)}
                  </span>
                </div>
              </div>
              {n.unread && (
                <div className="mt-3">
                  <form action={markRead.bind(null, n.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Mark read
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
