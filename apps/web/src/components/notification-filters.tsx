'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@forge-git/ui'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'Issue', label: 'Issues' },
  { value: 'PullRequest', label: 'Pull Requests' },
  { value: 'Commit', label: 'Commits' },
  { value: 'Repository', label: 'Repositories' },
]

export default function NotificationFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('type') ?? ''

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('type', value)
    } else {
      params.delete('type')
    }
    router.push(`/notifications?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      {FILTERS.map((f) => (
        <Button
          key={f.value}
          variant={active === f.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  )
}
