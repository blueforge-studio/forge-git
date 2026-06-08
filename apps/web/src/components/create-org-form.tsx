'use client'

import { useActionState } from 'react'
import { createOrgAction } from '@/app/organizations/actions'
import { Button, Input, Label } from '@forge-git/ui'

export default function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(createOrgAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Organization name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="my-org"
          autoFocus
        />
        {state.field === 'name' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>

      <div>
        <Label htmlFor="full_name">Display name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="My Organization"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Optional description"
        />
      </div>

      <div>
        <Label>Visibility</Label>
        <div className="mt-1 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="public"
              defaultChecked
              className="accent-primary"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="limited"
              className="accent-primary"
            />
            Limited
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="private"
              className="accent-primary"
            />
            Private
          </label>
        </div>
      </div>

      {state.error && !state.field && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create Organization'}
        </Button>
        <a
          href="/organizations"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
