'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, MessageSquare, Eye, ChevronDown, ChevronRight, User } from 'lucide-react'
import { timeAgo } from '@/lib/notification-utils'
import type { PullReview, PullReviewComment } from '@forge-git/gitea-bridge'

export interface PullReviewWithComments extends PullReview {
  inlineComments: PullReviewComment[]
}

const stateConfig: Record<string, { icon: typeof CheckCircle; label: string; cls: string }> = {
  APPROVED: { icon: CheckCircle, label: 'Approved', cls: 'text-green-600 bg-green-500/10 border-green-500/30' },
  REQUEST_CHANGES: { icon: XCircle, label: 'Changes requested', cls: 'text-red-600 bg-red-500/10 border-red-500/30' },
  COMMENT: { icon: MessageSquare, label: 'Reviewed', cls: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  REQUEST_REVIEW: { icon: Eye, label: 'Review requested', cls: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' },
}

export default function PullReviewList({ reviews }: { reviews: PullReviewWithComments[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const config = stateConfig[review.state] ?? stateConfig.COMMENT
        const Icon = config.icon
        const isExpanded = expanded.has(review.id)
        const hasInlineComments = review.inlineComments.length > 0

        return (
          <div key={review.id} className="border border-border rounded-lg overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              {review.reviewer.avatar_url ? (
                <img src={review.reviewer.avatar_url} alt={review.reviewer.login} className="w-6 h-6 rounded-full mt-0.5" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{review.reviewer.login}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${config.cls}`}>
                    <Icon className="w-3 h-3 inline mr-1" />
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(review.submitted_at)}</span>
                </div>
                {review.body && <p className="text-sm whitespace-pre-wrap">{review.body}</p>}
                {hasInlineComments && (
                  <button
                    onClick={() => toggle(review.id)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {review.inlineComments.length} inline comment{review.inlineComments.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
            {isExpanded && hasInlineComments && (
              <div className="border-t border-border bg-secondary/20 px-4 py-2 space-y-2">
                {review.inlineComments.map((c) => (
                  <div key={c.id} className="text-sm">
                    {c.path && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {c.path}{c.line != null ? `:${c.line}` : ''}
                      </span>
                    )}
                    <p className="mt-0.5">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
