'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { deleteOrgAction } from '@/app/organizations/actions'
import { Button, Input } from '@forge-git/ui'

export default function DeleteOrgButton({ orgName }: { orgName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [state, formAction, pending] = useActionState(deleteOrgAction, { error: '', field: '' })

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        onClick={() => setConfirming(true)}
      >
        Delete this organization
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orgName" value={orgName} />
      <p className="text-sm text-muted-foreground">
        Type <strong>{orgName}</strong> to confirm deletion. This action cannot be undone.
      </p>
      <Input
        type="text"
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        placeholder={orgName}
      />
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="destructive"
          disabled={pending || confirmName !== orgName}
        >
          {pending ? 'Deleting...' : 'Confirm delete'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirming(false)
            setConfirmName('')
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
