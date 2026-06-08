'use client'

import { useActionState } from 'react'
import { createPullRequestAction } from './actions'
import { Button, Input, Label, Textarea, Select } from '@forge-git/ui'

export default function CreatePullRequestForm({
  owner,
  repo,
  branches,
}: {
  owner: string
  repo: string
  branches: string[]
}) {
  const [state, formAction, pending] = useActionState(createPullRequestAction, {
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
          placeholder="Pull request title"
          className={state.field === 'title' ? 'border-destructive' : ''}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="head">Head Branch *</Label>
          {branches.length > 0 ? (
            <Select id="head" name="head" required>
              <option value="">Select branch...</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="head"
              name="head"
              type="text"
              required
              placeholder="feature-branch"
              className={state.field === 'head' ? 'border-destructive' : ''}
            />
          )}
        </div>

        <div>
          <Label htmlFor="base">Base Branch *</Label>
          {branches.length > 0 ? (
            <Select id="base" name="base" required defaultValue="main">
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="base"
              name="base"
              type="text"
              required
              defaultValue="main"
              placeholder="main"
              className={state.field === 'base' ? 'border-destructive' : ''}
            />
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="body">Description</Label>
        <Textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Describe the changes..."
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create Pull Request'}
      </Button>
    </form>
  )
}
