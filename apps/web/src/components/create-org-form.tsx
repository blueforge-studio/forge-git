'use client'

import { useActionState } from 'react'
import { createOrgAction } from '@/app/organizations/actions'

export default function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(createOrgAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor="name">
          Organization name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="my-org"
          autoFocus
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {state.field === 'name' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="full_name">
          Display name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="My Organization"
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Optional description"
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Visibility</label>
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
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Creating...' : 'Create Organization'}
        </button>
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
