'use client'

import { useActionState } from 'react'
import { createRepoAction } from '@/app/repositories/actions'
import { Button, Input, Label, Select } from '@forge-git/ui'

export default function CreateRepoForm() {
  const [state, formAction, pending] = useActionState(createRepoAction, { error: '', field: '' })

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Repository name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="my-project"
          autoFocus
        />
        {state.field === 'name' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Optional description"
        />
      </div>

      <div>
        <Label>Visibility</Label>
        <div className="mt-1 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="public"
              defaultChecked
              className="accent-primary"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="private"
              className="accent-primary"
            />
            Private
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="gitignore">.gitignore template</Label>
        <Select id="gitignore" name="gitignore">
          <option value="">None</option>
          <option value="Node">Node</option>
          <option value="Python">Python</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
          <option value="Java">Java</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="license">License</Label>
        <Select id="license" name="license">
          <option value="">None</option>
          <option value="MIT">MIT</option>
          <option value="Apache-2.0">Apache 2.0</option>
          <option value="GPL-3.0">GPL 3.0</option>
        </Select>
      </div>

      {state.error && !state.field && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create Repository'}
        </Button>
        <a
          href="/repositories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
