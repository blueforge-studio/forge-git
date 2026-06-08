'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Server } from 'lucide-react'
import { Button, Input, Label } from '@forge-git/ui'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: '' })

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
            <Label htmlFor="giteaUrl">
              Gitea URL
            </Label>
            <Input
              id="giteaUrl"
              name="giteaUrl"
              type="text"
              placeholder="https://forge-git.blueforge.studio"
            />
          </div>

          <div>
            <Label htmlFor="token">
              Personal Access Token
            </Label>
            <Input
              id="token"
              name="token"
              type="password"
              placeholder="Paste your token"
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

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
