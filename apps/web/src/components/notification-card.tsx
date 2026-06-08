'use client'

import Link from 'next/link'
import { Badge, Button } from '@forge-git/ui'
import { timeAgo, typeBadgeVariant } from '@/lib/notification-utils'
import { markRead } from '@/app/notifications/actions'
import type { Notification } from '@forge-git/gitea-bridge'

interface Props {
  notification: Notification
}

export default function NotificationCard({ notification: n }: Props) {
  return (
    <div
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
  )
}
