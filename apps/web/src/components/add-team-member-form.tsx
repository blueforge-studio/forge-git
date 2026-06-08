'use client'

import { useActionState, useRef } from 'react'
import { addTeamMemberAction } from '@/app/organizations/[name]/teams/[id]/actions'
import { Button, Input } from '@forge-git/ui'

export default function AddTeamMemberForm({ teamId, org }: { teamId: number; org: string }) {
  const [state, formAction, pending] = useActionState(addTeamMemberAction, { error: '', field: '' })
  const ref = useRef<HTMLFormElement>(null)

  if (state.error === '' && state.field === '' && !pending && ref.current) {
    ref.current.reset()
  }

  return (
    <form ref={ref} action={formAction} className="flex items-end gap-2 mt-3">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="org" value={org} />
      <div className="flex-1">
        <Input name="username" type="text" placeholder="Username to add" />
        {state.field === 'username' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? 'Adding...' : 'Add'}
      </Button>
    </form>
  )
}
