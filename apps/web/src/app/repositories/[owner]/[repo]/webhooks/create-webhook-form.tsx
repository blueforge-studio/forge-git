'use client'

import { useActionState } from 'react'
import { createWebhookAction } from '@/app/repositories/actions'
import { Button, Input } from '@forge-git/ui'

export default function CreateWebhookForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createWebhookAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 p-4">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <Input
        name="url"
        type="text"
        placeholder="Payload URL *"
        autoFocus
      />
      {state.field === 'url' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <Input
        name="events"
        type="text"
        placeholder="Events (comma-separated, default: push)"
        defaultValue="push"
      />

      {state.error && !state.field && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Adding...' : 'Add Webhook'}
      </Button>
    </form>
  )
}
