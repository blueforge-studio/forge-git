'use client'

import { useActionState, Suspense, useEffect, useState, useCallback } from 'react'
import { login } from './actions'
import { LogIn, ChevronRight, Key, AlertCircle, Clipboard, Check } from 'lucide-react'
import { Button, cn } from '@forge-git/ui'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const GITEA_URL_STORAGE_KEY = 'forge-git:last-gitea-url'

function useGiteaUrlMemory() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GITEA_URL_STORAGE_KEY)
      if (stored) setUrl(stored)
    } catch {
      // private browsing / quota — degrade silently
    }
  }, [])

  const persist = useCallback((value: string) => {
    setUrl(value)
    try {
      if (value) {
        window.localStorage.setItem(GITEA_URL_STORAGE_KEY, value)
      } else {
        window.localStorage.removeItem(GITEA_URL_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  return { url, setUrl: persist }
}

type HealthStatus = 'idle' | 'checking' | 'ok' | 'unreachable'

function useUrlHealth(url: string) {
  const [status, setStatus] = useState<HealthStatus>('idle')

  useEffect(() => {
    if (!url) {
      setStatus('idle')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setStatus('checking')
    const timer = setTimeout(async () => {
      try {
        await fetch(`${url}/api/v1/version`, { method: 'GET', signal: controller.signal })
        if (!cancelled) setStatus('ok')
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('unreachable')
      }
    }, 400)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [url])

  return status
}

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
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: '' })
  const t = useTranslations('login')
  const { url: rememberedUrl, setUrl: persistUrl } = useGiteaUrlMemory()
  const [giteaUrl, setGiteaUrl] = useState('')
  const healthStatus = useUrlHealth(giteaUrl)

  useEffect(() => {
    if (rememberedUrl) setGiteaUrl(rememberedUrl)
  }, [rememberedUrl])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <Suspense fallback={<div className="w-full max-w-sm h-96 glass-card animate-pulse" />}>
        <div className="w-full max-w-sm">
          <div className="glass-card p-8 relative overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            <div className="text-center mb-6 mt-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <img
                  src="/images/logo-mark.webp"
                  alt="Forge git"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span className="font-semibold text-foreground">Forge git</span>
              </Link>
              <h1 className="text-xl font-bold text-foreground">Sign in to forge-git</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to your Gitea instance
              </p>
            </div>

            <Suspense>
              <OAuthError />
            </Suspense>

            {/* OAuth button */}
            <div className="space-y-2 mb-5">
              <Link
                href="/api/auth/authorize"
                className="btn-glow w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Gitea
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                One-click sign in. Requires OAuth2 configured in your Gitea instance.
              </p>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or use a personal access token
                </span>
              </div>
            </div>

            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                <Key className="w-4 h-4" />
                Manual token
              </summary>

              <form action={formAction} className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="giteaUrl"
                    name="giteaUrl"
                    type="text"
                    placeholder={t('giteaUrlPlaceholder')}
                    required
                    value={giteaUrl}
                    onChange={(e) => {
                      setGiteaUrl(e.target.value)
                      persistUrl(e.target.value)
                    }}
                    className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                  {healthStatus !== 'idle' && (
                    <span
                      data-testid="url-health-pill"
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs whitespace-nowrap',
                        healthStatus === 'checking' && 'text-muted-foreground',
                        healthStatus === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                        healthStatus === 'unreachable' && 'text-destructive',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          healthStatus === 'checking' && 'bg-muted-foreground animate-pulse',
                          healthStatus === 'ok' && 'bg-emerald-600 dark:bg-emerald-400',
                          healthStatus === 'unreachable' && 'bg-destructive',
                        )}
                      />
                      {healthStatus === 'checking' && t('urlHealthChecking')}
                      {healthStatus === 'ok' && t('urlHealthOk')}
                      {healthStatus === 'unreachable' && t('urlHealthUnreachable')}
                    </span>
                  )}
                </div>
                {giteaUrl && giteaUrl === rememberedUrl && (
                  <p data-testid="last-used-hint" className="text-[10px] text-muted-foreground">
                    {t('lastUsedHint')}
                  </p>
                )}
                <input
                  id="token"
                  name="token"
                  type="password"
                  placeholder="Paste your token"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Generate one at your Gitea user settings → Applications
                </p>

                {state.error && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                    {state.error}
                  </p>
                )}

                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? 'Signing in...' : 'Sign in with PAT'}
                </Button>
              </form>
            </details>

            <details className="text-xs text-muted-foreground border-t border-border mt-5 pt-4 group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                {t('setupHelpSummary')}
              </summary>
              <ol className="list-decimal list-inside space-y-1 mt-3 pl-1">
                <li>{t('setupHelpStep1')}</li>
                <li>
                  {t('setupHelpStep2')} <CodeBlock code={t('setupHelpRedirect')} />
                </li>
                <li>{t('setupHelpStep3')}</li>
                <li>
                  {t('setupHelpStep4')} <CodeBlock code={t('setupHelpCli')} />
                </li>
              </ol>
            </details>
          </div>
        </div>
      </Suspense>
    </main>
  )
}

function CodeBlock({ code }: { code: string }) {
  const t = useTranslations('login')
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{code}</code>
      <button
        type="button"
        onClick={onCopy}
        data-testid="copy-code-button"
        aria-label={t('copyCode')}
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
        {copied ? t('copyCodeCopied') : t('copyCode')}
      </button>
    </span>
  )
}
