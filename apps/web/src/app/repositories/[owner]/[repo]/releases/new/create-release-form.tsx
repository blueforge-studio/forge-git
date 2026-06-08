'use client'

import { useActionState } from 'react'
import { createReleaseAction } from './actions'
import { Button, Input, Label, Textarea } from '@forge-git/ui'

export default function CreateReleaseForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createReleaseAction, {
    error: '',
    field: '',
  })

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <div>
        <Label htmlFor="tag_name">Tag Name *</Label>
        <Input
          id="tag_name"
          name="tag_name"
          type="text"
          required
          placeholder="v1.0.0"
          className={state.field === 'tag_name' ? 'border-destructive' : ''}
        />
      </div>

      <div>
        <Label htmlFor="name">Release Title *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="First Release"
          className={state.field === 'name' ? 'border-destructive' : ''}
        />
      </div>

      <div>
        <Label htmlFor="body">Release Notes</Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          placeholder="What's new in this release..."
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="prerelease" value="true" className="rounded" />
          Pre-release
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="draft" value="true" className="rounded" />
          Draft
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Release'}
      </Button>
    </form>
  )
}
