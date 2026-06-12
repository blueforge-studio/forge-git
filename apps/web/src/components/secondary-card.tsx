import type { ReactNode } from 'react'
import Link from 'next/link'

export interface SecondaryCardProps {
  href: string
  icon: ReactNode
  title: string
  description: string
  testId: string
  external?: boolean
}

export default function SecondaryCard({
  href,
  icon,
  title,
  description,
  testId,
  external = false,
}: SecondaryCardProps) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <span className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden={true}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid={testId}
      >
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
