'use client'

import { useActionState } from 'react'
import { addMemberAction } from '@/app/organizations/actions'
import { useRef } from 'react'

export default function AddMemberForm({ org }: { org: string }) {
  const [state, formAction, pending] = useActionState(addMemberAction, { error: '', field: '' })
  const ref = useRef<HTMLFormElement>(null)

  if (state.error === '' && state.field === '' && !pending && ref.current) {
    ref.current.reset()
  }

  return (
    <form ref={ref} action={formAction} className="flex items-end gap-2 mt-3">
      <input type="hidden" name="org" value={org} />
      <div className="flex-1">
        <input
          name="username"
          type="text"
          placeholder="Username to add"
          autoFocus
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {state.field === 'username' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
      >
        {pending ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
