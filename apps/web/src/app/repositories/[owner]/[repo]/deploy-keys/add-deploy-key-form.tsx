'use client'

import { useActionState } from 'react'
import { addDeployKeyAction } from '@/app/repositories/actions'

export default function AddDeployKeyForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(addDeployKeyAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 p-4">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <input
        name="title"
        type="text"
        placeholder="Title *"
        autoFocus
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {state.field === 'title' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <textarea
        name="key"
        placeholder="Paste your public SSH key *"
        rows={4}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono text-xs"
      />
      {state.field === 'key' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="read_only" value="true" className="accent-primary" />
        Read-only
      </label>

      {state.error && !state.field && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Add Deploy Key'}
      </button>
    </form>
  )
}
