'use client'

import { useActionState } from 'react'
import { createIssueAction } from './actions'
import { Button, Input, Label, Textarea } from '@forge-git/ui'

export default function CreateIssueForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createIssueAction, {
    error: '',
    field: '',
  })

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Issue title"
          className={state.field === 'title' ? 'border-destructive' : ''}
        />
      </div>

      <div>
        <Label htmlFor="body">Description</Label>
        <Textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Describe the issue..."
        />
      </div>

      <div>
        <Label htmlFor="labels">Labels</Label>
        <Input
          id="labels"
          name="labels"
          type="text"
          placeholder="bug, enhancement (comma-separated)"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Issue'}
      </Button>
    </form>
  )
}
