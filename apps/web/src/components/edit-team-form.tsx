'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { updateTeamAction, deleteTeamAction } from '@/app/organizations/[name]/teams/[id]/actions'
import { Button, Input, Select } from '@forge-git/ui'
import type { Team } from '@forge-git/gitea-bridge'

export default function EditTeamForm({ team, org }: { team: Team; org: string }) {
  const [editing, setEditing] = useState(false)
  const [editState, editFormAction, editPending] = useActionState(updateTeamAction, { error: '', field: '' })
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteTeamAction, { error: '', field: '' })

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) {
      const form = document.getElementById('delete-team-form') as HTMLFormElement
      form?.requestSubmit()
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="w-full">
          Edit Team
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deletePending} className="w-full">
          {deletePending ? 'Deleting...' : 'Delete Team'}
        </Button>

        <form id="delete-team-form" action={deleteFormAction} className="hidden">
          <input type="hidden" name="teamId" value={team.id} />
          <input type="hidden" name="org" value={org} />
        </form>

        {deleteState.error && <p className="text-xs text-destructive">{deleteState.error}</p>}
      </div>
    )
  }

  return (
    <form action={editFormAction} className="space-y-2">
      <input type="hidden" name="teamId" value={team.id} />
      <input type="hidden" name="org" value={org} />

      <Input name="name" type="text" defaultValue={team.name} placeholder="Team name" />
      {editState.field === 'name' && editState.error && (
        <p className="text-xs text-destructive">{editState.error}</p>
      )}

      <Input name="description" type="text" defaultValue={team.description || ''} placeholder="Description (optional)" />

      <Select name="permission" defaultValue={team.permission}>
        <option value="read">Read</option>
        <option value="write">Write</option>
        <option value="admin">Admin</option>
      </Select>

      {editState.error && !editState.field && (
        <p className="text-xs text-destructive">{editState.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={editPending} size="sm">
          {editPending ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
