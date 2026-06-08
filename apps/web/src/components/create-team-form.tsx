'use client'

import { useActionState } from 'react'
import { createTeamAction } from '@/app/organizations/actions'

export default function CreateTeamForm({ org }: { org: string }) {
  const [state, formAction, pending] = useActionState(createTeamAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 mt-3">
      <input type="hidden" name="org" value={org} />
      <input
        name="name"
        type="text"
        placeholder="Team name"
        autoFocus
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {state.field === 'name' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <input
        name="description"
        type="text"
        placeholder="Description (optional)"
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <select
        name="permission"
        defaultValue="read"
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="read">Read</option>
        <option value="write">Write</option>
        <option value="admin">Admin</option>
      </select>
      {state.error && !state.field && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Creating...' : 'Create Team'}
      </button>
    </form>
  )
}
