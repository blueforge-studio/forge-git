'use client'

import { useActionState } from 'react'
import { createTeamAction } from '@/app/organizations/actions'
import { Button, Input, Select } from '@forge-git/ui'

export default function CreateTeamForm({ org }: { org: string }) {
  const [state, formAction, pending] = useActionState(createTeamAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 mt-3">
      <input type="hidden" name="org" value={org} />
      <Input
        name="name"
        type="text"
        placeholder="Team name"
        autoFocus
      />
      {state.field === 'name' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <Input
        name="description"
        type="text"
        placeholder="Description (optional)"
      />
      <Select
        name="permission"
        defaultValue="read"
      >
        <option value="read">Read</option>
        <option value="write">Write</option>
        <option value="admin">Admin</option>
      </Select>
      {state.error && !state.field && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Creating...' : 'Create Team'}
      </Button>
    </form>
  )
}
