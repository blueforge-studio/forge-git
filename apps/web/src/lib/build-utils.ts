export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function stateBadgeVariant(state: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
  switch (state) {
    case 'active': return 'default'
    case 'completed': return 'success'
    case 'failed': return 'destructive'
    case 'waiting':
    case 'delayed': return 'secondary'
    default: return 'outline'
  }
}
