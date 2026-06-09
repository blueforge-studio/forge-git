'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

async function fetchCount(): Promise<number> {
  const res = await fetch('/api/notifications/count')
  if (!res.ok) throw new Error('Failed to fetch')
  const data = await res.json() as { count: number }
  return data.count
}

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  const updateCount = useCallback(() => {
    fetchCount().then(setCount).catch(() => setCount(0))
  }, [])

  useEffect(() => {
    updateCount()
    const interval = setInterval(updateCount, 30_000)
    return () => clearInterval(interval)
  }, [updateCount])

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
