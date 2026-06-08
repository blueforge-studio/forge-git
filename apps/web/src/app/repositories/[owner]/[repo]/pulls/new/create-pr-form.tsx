'use client'

import { useActionState } from 'react'
import { createPullRequestAction } from './actions'

export default function CreatePullRequestForm({
  owner,
  repo,
  branches,
}: {
  owner: string
  repo: string
  branches: string[]
}) {
  const [state, formAction, pending] = useActionState(createPullRequestAction, {
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
          placeholder="Pull request title"
          className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            state.field === 'title' ? 'border-destructive' : 'border-input'
          }`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="head" className="block text-sm font-medium mb-1">
            Head Branch *
          </label>
          {branches.length > 0 ? (
            <select
              id="head"
              name="head"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select branch...</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="head"
              name="head"
              type="text"
              required
              placeholder="feature-branch"
              className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                state.field === 'head' ? 'border-destructive' : 'border-input'
              }`}
            />
          )}
        </div>

        <div>
          <label htmlFor="base" className="block text-sm font-medium mb-1">
            Base Branch *
          </label>
          {branches.length > 0 ? (
            <select
              id="base"
              name="base"
              required
              defaultValue="main"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="base"
              name="base"
              type="text"
              required
              defaultValue="main"
              placeholder="main"
              className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                state.field === 'base' ? 'border-destructive' : 'border-input'
              }`}
            />
          )}
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Describe the changes..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
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
        {pending ? 'Creating...' : 'Create Pull Request'}
      </button>
    </form>
  )
}
