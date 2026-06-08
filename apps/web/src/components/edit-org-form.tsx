'use client'

import { useActionState } from 'react'
import { editOrgAction } from '@/app/organizations/actions'
import { Button, Input, Label, Select } from '@forge-git/ui'
import type { GiteaOrg } from '@forge-git/gitea-bridge'

export default function EditOrgForm({ org }: { org: GiteaOrg }) {
  const [state, formAction, pending] = useActionState(editOrgAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="org" value={org.name} />

      <div>
        <Label htmlFor="full_name">Display name</Label>
        <Input id="full_name" name="full_name" type="text" defaultValue={org.full_name || ''} placeholder="My Organization" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" type="text" defaultValue={org.description || ''} placeholder="Optional description" />
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" type="url" defaultValue={org.website || ''} placeholder="https://example.com" />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" type="text" defaultValue={org.location || ''} placeholder="City, Country" />
      </div>

      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select id="visibility" name="visibility" defaultValue={org.visibility || 'public'}>
          <option value="public">Public</option>
          <option value="limited">Limited</option>
          <option value="private">Private</option>
        </Select>
      </div>

      {state.error && !state.field && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save Settings'}
        </Button>
        <a href={`/organizations/${org.name}`} className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </a>
      </div>
    </form>
  )
}
