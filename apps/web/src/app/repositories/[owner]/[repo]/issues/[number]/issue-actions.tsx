'use client'

import { useState } from 'react'
import { closeIssueAction, reopenIssueAction } from './actions'
import { Button } from '@forge-git/ui'

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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => act('close')}
            disabled={pending !== null}
          >
            {pending === 'close' ? 'Closing...' : 'Close Issue'}
          </Button>
        )}
        {state === 'closed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => act('reopen')}
            disabled={pending !== null}
          >
            {pending === 'reopen' ? 'Reopening...' : 'Reopen Issue'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
