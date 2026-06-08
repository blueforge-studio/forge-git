'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Server } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {})

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Server className="w-8 h-8 mx-auto mb-2" />
          <h1 className="text-xl font-semibold">Sign in to forge-git</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect to your Gitea instance
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="giteaUrl">
              Gitea URL
            </label>
            <input
              id="giteaUrl"
              name="giteaUrl"
              type="text"
              placeholder="https://forge-git.blueforge.studio"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="token">
              Personal Access Token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              placeholder="Paste your token"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate one at your Gitea user settings → Applications
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
