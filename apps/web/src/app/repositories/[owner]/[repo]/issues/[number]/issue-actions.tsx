'use client'

import { useState } from 'react'
import { closeIssueAction, reopenIssueAction } from './actions'

interface Props {
  owner: string
  repo: string
  issueNumber: number
  state: 'open' | 'closed'
}

export default function IssueActions({ owner, repo, issueNumber, state }: Props) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'close' | 'reopen' | null>(null)

  async function act(action: 'close' | 'reopen') {
    setPending(action)
    setError('')
    try {
      if (action === 'close') await closeIssueAction(owner, repo, issueNumber)
      else await reopenIssueAction(owner, repo, issueNumber)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setPending(null)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {state === 'open' && (
          <button
            onClick={() => act('close')}
            disabled={pending !== null}
            className="inline-flex items-center h-8 px-3 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50"
          >
            {pending === 'close' ? 'Closing...' : 'Close Issue'}
          </button>
        )}
        {state === 'closed' && (
          <button
            onClick={() => act('reopen')}
            disabled={pending !== null}
            className="inline-flex items-center h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-secondary/30 disabled:opacity-50"
          >
            {pending === 'reopen' ? 'Reopening...' : 'Reopen Issue'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
