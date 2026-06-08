import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-lg font-medium mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
