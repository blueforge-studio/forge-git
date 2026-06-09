'use client'

import { useActionState, useRef } from 'react'
import {
  addTeamRepoAction,
  removeTeamRepoAction,
} from '@/app/organizations/[name]/teams/[id]/actions'
import { Button, Input } from '@forge-git/ui'
import type { GiteaRepo } from '@forge-git/gitea-bridge'
import Link from 'next/link'

export default function TeamRepoManager({
  teamId,
  orgName,
  repos,
}: {
  teamId: number
  orgName: string
  repos: GiteaRepo[]
}) {
  const [addState, addFormAction, addPending] = useActionState(addTeamRepoAction, {
    error: '',
    field: '',
  })
  const [removeState, removeFormAction, removePending] = useActionState(
    removeTeamRepoAction,
    { error: '', field: '' }
  )
  const addRef = useRef<HTMLFormElement>(null)

  if (addState.error === '' && addState.field === '' && !addPending && addRef.current) {
    addRef.current.reset()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Manage Repositories</h2>

      {repos.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          No repositories assigned to this team.
        </p>
      ) : (
        <div className="grid gap-2 mb-6">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="border border-border rounded-lg p-3 flex items-center justify-between"
            >
              <Link
                href={`/repositories/${repo.full_name}`}
                className="text-sm font-medium hover:text-primary hover:underline"
              >
                {repo.full_name}
              </Link>
              <form action={removeFormAction}>
                <input type="hidden" name="teamId" value={teamId} />
                <input type="hidden" name="org" value={orgName} />
                <input type="hidden" name="repoName" value={repo.name} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={removePending}
                  className="text-destructive hover:text-destructive"
                >
                  {removePending ? 'Removing...' : 'Remove'}
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      {removeState.error && (
        <p className="text-xs text-destructive mb-4">{removeState.error}</p>
      )}

      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Add Repository</h3>
        <form ref={addRef} action={addFormAction} className="flex items-end gap-2">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="org" value={orgName} />
          <div className="flex-1">
            <Input
              name="repoName"
              type="text"
              placeholder="Repository name"
            />
            {addState.field === 'repoName' && addState.error && (
              <p className="text-xs text-destructive mt-1">{addState.error}</p>
            )}
          </div>
          <Button type="submit" disabled={addPending} size="sm">
            {addPending ? 'Adding...' : 'Add'}
          </Button>
        </form>
        {addState.error && !addState.field && (
          <p className="text-xs text-destructive mt-2">{addState.error}</p>
        )}
      </div>
    </div>
  )
}
