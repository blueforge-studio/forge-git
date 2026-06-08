'use client'

import { useActionState } from 'react'
import { createReleaseAction } from './actions'

export default function CreateReleaseForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createReleaseAction, {
    error: '',
    field: '',
  })

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <div>
        <label htmlFor="tag_name" className="block text-sm font-medium mb-1">
          Tag Name *
        </label>
        <input
          id="tag_name"
          name="tag_name"
          type="text"
          required
          placeholder="v1.0.0"
          className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            state.field === 'tag_name' ? 'border-destructive' : 'border-input'
          }`}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Release Title *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="First Release"
          className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            state.field === 'name' ? 'border-destructive' : 'border-input'
          }`}
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Release Notes
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          placeholder="What's new in this release..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="prerelease" value="true" className="rounded" />
          Pre-release
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="draft" value="true" className="rounded" />
          Draft
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Creating...' : 'Create Release'}
      </button>
    </form>
  )
}
