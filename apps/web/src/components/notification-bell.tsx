'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('/api/notifications/count')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json() as Promise<{ count: number }>
      })
      .then((data) => setCount(data.count))
      .catch(() => setCount(0))
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center hover:text-primary"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white bg-destructive rounded-full">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
