'use client'

import { useActionState } from 'react'
import type { Webhook } from '@forge-git/gitea-bridge'
import { deleteWebhookAction } from '@/app/repositories/actions'

export default function WebhookList({
  owner,
  repo,
  webhooks,
}: {
  owner: string
  repo: string
  webhooks: Webhook[]
}) {
  return (
    <div className="space-y-3">
      {webhooks.map((hook) => (
        <div key={hook.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded">{hook.config.url}</code>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                hook.active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {hook.active ? 'active' : 'inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {hook.events.join(', ')} &middot; {hook.config.content_type}
            </p>
          </div>
          <DeleteWebhookButton owner={owner} repo={repo} hookId={hook.id} />
        </div>
      ))}
    </div>
  )
}

function DeleteWebhookButton({ owner, repo, hookId }: { owner: string; repo: string; hookId: number }) {
  const [, formAction, pending] = useActionState(deleteWebhookAction, { error: '', field: '' })

  return (
    <form action={formAction}>
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />
      <input type="hidden" name="hookId" value={hookId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {pending ? 'Deleting...' : 'Delete'}
      </button>
    </form>
  )
}
