'use client'

import { useActionState } from 'react'
import { updateProfileAction } from './actions'

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
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={defaults.full_name || ''}
            placeholder="Your name"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email || ''}
            placeholder="you@example.com"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={defaults.location || ''}
            placeholder="City, Country"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={defaults.website || ''}
            placeholder="https://example.com"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
