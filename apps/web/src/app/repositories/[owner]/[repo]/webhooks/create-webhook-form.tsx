'use client'

import { useActionState } from 'react'
import { createWebhookAction } from '@/app/repositories/actions'

export default function CreateWebhookForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createWebhookAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-2 p-4">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <input
        name="url"
        type="text"
        placeholder="Payload URL *"
        autoFocus
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {state.field === 'url' && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <input
        name="events"
        type="text"
        placeholder="Events (comma-separated, default: push)"
        defaultValue="push"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      {state.error && !state.field && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Add Webhook'}
      </button>
    </form>
  )
}
