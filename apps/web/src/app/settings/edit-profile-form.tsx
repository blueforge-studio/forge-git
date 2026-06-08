'use client'

import { useActionState } from 'react'
import { updateProfileAction } from './actions'
import { Button, Input, Label } from '@forge-git/ui'

interface Props {
  defaults: {
    full_name?: string
    email?: string
    location?: string
    website?: string
  }
}

export default function EditProfileForm({ defaults }: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {
    error: '',
    field: '',
    success: '',
  })

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={defaults.full_name || ''}
            placeholder="Your name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email || ''}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            type="text"
            defaultValue={defaults.location || ''}
            placeholder="City, Country"
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={defaults.website || ''}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
