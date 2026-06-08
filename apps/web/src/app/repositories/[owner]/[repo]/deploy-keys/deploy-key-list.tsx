'use client'

import { useActionState } from 'react'
import type { RepoKey } from '@forge-git/gitea-bridge'
import { deleteDeployKeyAction } from '@/app/repositories/actions'

export default function DeployKeyList({
  owner,
  repo,
  keys,
}: {
  owner: string
  repo: string
  keys: RepoKey[]
}) {
  return (
    <div className="space-y-3">
      {keys.map((key) => (
        <div key={key.id} className="border border-border rounded-lg p-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{key.title}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                key.read_only
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {key.read_only ? 'read-only' : 'read/write'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{key.fingerprint}</p>
            <p className="text-xs text-muted-foreground">Added {new Date(key.created_at).toLocaleDateString()}</p>
          </div>
          <DeleteDeployKeyButton owner={owner} repo={repo} keyId={key.id} />
        </div>
      ))}
    </div>
  )
}

function DeleteDeployKeyButton({ owner, repo, keyId }: { owner: string; repo: string; keyId: number }) {
  const [, formAction, pending] = useActionState(deleteDeployKeyAction, { error: '', field: '' })

  return (
    <form action={formAction}>
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />
      <input type="hidden" name="keyId" value={keyId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-destructive hover:underline disabled:opacity-50 shrink-0"
      >
        {pending ? 'Deleting...' : 'Delete'}
      </button>
    </form>
  )
}
