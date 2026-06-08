'use client'

import { useActionState } from 'react'
import type { BranchProtection } from '@forge-git/gitea-bridge'
import { setBranchProtectionAction } from '@/app/repositories/actions'
import { Button, Input, Label } from '@forge-git/ui'

export default function BranchProtectionForm({
  owner,
  repo,
  branch,
  initialData,
}: {
  owner: string
  repo: string
  branch: string
  initialData: BranchProtection | null
}) {
  const [state, formAction, pending] = useActionState(setBranchProtectionAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />
      <input type="hidden" name="branch" value={branch} />

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="enable_push" value="true" defaultChecked={initialData?.enable_push} className="accent-primary" />
        Allow direct pushes
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="require_pull_request" value="true" defaultChecked={initialData?.require_pull_request} className="accent-primary" />
        Require pull request before merging
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="dismiss_stale_approvals" value="true" defaultChecked={initialData?.dismiss_stale_approvals} className="accent-primary" />
        Dismiss stale approvals on new commits
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="enable_status_check" value="true" defaultChecked={initialData?.enable_status_check} className="accent-primary" />
        Require status checks to pass
      </label>

      <div>
        <Label htmlFor="status_check_contexts">
          Status check contexts
        </Label>
        <Input
          id="status_check_contexts"
          name="status_check_contexts"
          type="text"
          placeholder="ci/build, ci/test"
          defaultValue={initialData?.status_check_contexts?.join(', ')}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="enable_push_whitelist" value="true" defaultChecked={initialData?.enable_push_whitelist} className="accent-primary" />
        Restrict push access
      </label>

      <div>
        <Label htmlFor="push_whitelist_usernames">
          Allowed pushers
        </Label>
        <Input
          id="push_whitelist_usernames"
          name="push_whitelist_usernames"
          type="text"
          placeholder="user1, user2"
          defaultValue={initialData?.push_whitelist_usernames?.join(', ')}
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
