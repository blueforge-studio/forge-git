'use client'

import { useActionState } from 'react'
import { removeMemberAction } from '@/app/organizations/actions'

export default function RemoveMemberButton({ org, username }: { org: string; username: string }) {
  const [, formAction, pending] = useActionState(removeMemberAction, { error: '', field: '' })

  return (
    <form action={formAction}>
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
