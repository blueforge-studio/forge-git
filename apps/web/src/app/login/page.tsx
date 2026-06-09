'use client'

import { useActionState, Suspense } from 'react'
import { login } from './actions'
import { Server, LogIn, ChevronRight, Key, AlertCircle } from 'lucide-react'
import { Button, Input, Label } from '@forge-git/ui'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function OAuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!error) return null

  const errorMessages: Record<string, string> = {
    'no-gitea-url': 'Gitea URL is not configured. Set GITEA_URL environment variable.',
    'oauth-not-configured': 'OAuth is not configured. Set GITEA_OAUTH_CLIENT_ID and GITEA_OAUTH_CLIENT_SECRET.',
    'oauth-session-expired': 'Your OAuth session expired. Please try signing in again.',
    'oauth-state-mismatch': 'Security check failed. Please try signing in again.',
    'oauth-exchange-failed': 'Failed to exchange authorization code. Please try again.',
    'oauth-token-invalid': 'Received an invalid token from Gitea. Please try again.',
    'oauth-access_denied': 'You denied the authorization request.',
    'oauth-missing-params': 'Missing required OAuth parameters. Please try again.',
    'oauth-invalid-state': 'Invalid OAuth state. Please try signing in again.',
  }

  const message = errorMessages[error] ?? `Authentication error: ${error}`

  return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

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

        <Suspense>
          <OAuthError />
        </Suspense>

        <div className="space-y-2">
          <Link href="/api/auth/authorize" className="block">
            <Button variant="default" className="w-full" asChild>
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign in with Gitea
              </span>
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground text-center">
            One-click sign in. Requires an OAuth2 application registered in your Gitea instance.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or use a personal access token
            </span>
          </div>
        </div>

        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            <Key className="w-4 h-4" />
            Manual token
          </summary>

          <form action={formAction} className="mt-4 space-y-4">
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
              {pending ? 'Signing in...' : 'Sign in with PAT'}
            </Button>
          </form>
        </details>

        <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-4">
          <p className="font-medium">Setting up OAuth</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Go to your Gitea instance → Site Administration → Applications → OAuth2 Applications
            </li>
            <li>
              Register a new application with redirect URI:{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                /api/auth/callback
              </code>
            </li>
            <li>
              Set the environment variables{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">GITEA_OAUTH_CLIENT_ID</code>
              {' '}and{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">GITEA_OAUTH_CLIENT_SECRET</code>
            </li>
            <li>
              Or use the CLI:{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">fgit token setup-oauth</code>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
