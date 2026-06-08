'use client'

import { useActionState } from 'react'
import { removeTeamMemberAction } from '@/app/organizations/[name]/teams/[id]/actions'

export default function RemoveTeamMemberButton({
  teamId, org, username,
}: {
  teamId: number; org: string; username: string
}) {
  const [, formAction, pending] = useActionState(removeTeamMemberAction, { error: '', field: '' })

  return (
    <form action={formAction}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="org" value={org} />
      <input type="hidden" name="username" value={username} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {pending ? 'Removing...' : 'Remove'}
      </button>
    </form>
  )
}
