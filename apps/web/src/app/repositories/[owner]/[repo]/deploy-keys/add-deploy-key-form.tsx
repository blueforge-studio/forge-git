'use client'

import { useActionState } from 'react'
import { addDeployKeyAction } from '@/app/repositories/actions'
import { Button, Input, Textarea } from '@forge-git/ui'

export default function AddDeployKeyForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(addDeployKeyAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 p-4">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <Input
        name="title"
        type="text"
        placeholder="Title *"
        autoFocus
      />
      {state.field === 'title' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <Textarea
        name="key"
        placeholder="Paste your public SSH key *"
        rows={4}
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

      <Button type="submit" disabled={pending}>
        {pending ? 'Adding...' : 'Add Deploy Key'}
      </Button>
    </form>
  )
}
