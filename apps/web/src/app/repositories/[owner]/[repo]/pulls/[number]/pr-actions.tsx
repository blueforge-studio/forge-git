'use client'

import { useState } from 'react'
import { closePullRequestAction, reopenPullRequestAction, mergePullRequestAction } from './actions'

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
            <button
              onClick={() => act('merge')}
              disabled={pending !== null}
              className="inline-flex items-center h-8 px-3 rounded-md bg-green-600 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {pending === 'merge' ? 'Merging...' : 'Merge'}
            </button>
            <button
              onClick={() => act('close')}
              disabled={pending !== null}
              className="inline-flex items-center h-8 px-3 rounded-md border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 disabled:opacity-50"
            >
              {pending === 'close' ? 'Closing...' : 'Close'}
            </button>
          </>
        )}
        {state === 'closed' && !merged && (
          <button
            onClick={() => act('reopen')}
            disabled={pending !== null}
            className="inline-flex items-center h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-secondary/30 disabled:opacity-50"
          >
            {pending === 'reopen' ? 'Reopening...' : 'Reopen'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
