'use client'

import { useState } from 'react'
import { closePullRequestAction, reopenPullRequestAction, mergePullRequestAction } from './actions'
import { Button } from '@forge-git/ui'

interface Props {
  owner: string
  repo: string
  prNumber: number
  state: 'open' | 'closed'
  merged: boolean
}

export default function PullRequestActions({ owner, repo, prNumber, state, merged }: Props) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'close' | 'reopen' | 'merge' | null>(null)

  async function act(action: 'close' | 'reopen' | 'merge') {
    setPending(action)
    setError('')
    try {
      if (action === 'close') await closePullRequestAction(owner, repo, prNumber)
      else if (action === 'reopen') await reopenPullRequestAction(owner, repo, prNumber)
      else {
        const result = await mergePullRequestAction(owner, repo, prNumber)
        if (result?.error) { setError(result.error); setPending(null); return }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    setPending(null)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {state === 'open' && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => act('merge')}
              disabled={pending !== null}
            >
              {pending === 'merge' ? 'Merging...' : 'Merge'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => act('close')}
              disabled={pending !== null}
            >
              {pending === 'close' ? 'Closing...' : 'Close'}
            </Button>
          </>
        )}
        {state === 'closed' && !merged && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => act('reopen')}
            disabled={pending !== null}
          >
            {pending === 'reopen' ? 'Reopening...' : 'Reopen'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
