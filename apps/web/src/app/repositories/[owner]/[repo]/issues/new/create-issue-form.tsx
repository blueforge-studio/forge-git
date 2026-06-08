'use client'

import { useActionState } from 'react'
import { createIssueAction } from './actions'

export default function CreateIssueForm({ owner, repo }: { owner: string; repo: string }) {
  const [state, formAction, pending] = useActionState(createIssueAction, {
    error: '',
    field: '',
  })

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="owner" value={owner} />
      <input type="hidden" name="repo" value={repo} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Issue title"
          className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            state.field === 'title' ? 'border-destructive' : 'border-input'
          }`}
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Describe the issue..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
        />
      </div>

      <div>
        <label htmlFor="labels" className="block text-sm font-medium mb-1">
          Labels
        </label>
        <input
          id="labels"
          name="labels"
          type="text"
          placeholder="bug, enhancement (comma-separated)"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Creating...' : 'Create Issue'}
      </button>
    </form>
  )
}
