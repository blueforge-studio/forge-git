'use client'

import { useActionState, Suspense, useEffect, useState } from 'react'
import { login } from './actions'
import { LogIn, ChevronRight, Key, AlertCircle, Clipboard, Check } from 'lucide-react'
import { Button, cn } from '@forge-git/ui'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'
import { AuthShell } from '@/components/auth/auth-shell'

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
  const t = useTranslations('login')
  const error = searchParams.get('error')

  if (!error) return null

  let message: string
  try {
    message = t(`oauthError.${error}` as const)
  } catch {
    message = t('oauthError.unknown', { error })
  }

  return (
    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
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
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    if (rememberedUrl) setGiteaUrl(rememberedUrl)
  }, [rememberedUrl])

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setUrlError('')
      // Empty is allowed at submit time — the server action will return
      // the canonical "Gitea URL is required" error. This keeps a single
      // source of truth for the empty-field error message.
      return true
    }
    try {
      const parsed = new URL(value)
      if (!parsed.protocol.startsWith('http')) throw new Error()
      setUrlError('')
      return true
    } catch {
      setUrlError(t('urlInvalid'))
      return false
    }
  }

  return (
    <AuthShell tagline={t('tagline')}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('headline')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {t('subhead')}
        </p>
      </div>

      <Suspense>
        <OAuthError />
      </Suspense>

      {/* OAuth button */}
      <div className="space-y-2 mb-5">
        <Link
          href="/api/auth/authorize"
          className="btn-glow w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium group"
        >
          <LogIn className="w-4 h-4" />
          {t('oauthButton')}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          {t('oauthHint')}
        </p>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-card px-2 text-muted-foreground">
            {t('orUsePat')}
          </span>
        </div>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <Key className="w-3.5 h-3.5" />
          {t('patSummary')}
        </summary>

        <form
          action={(formData) => {
            if (!validateUrl(giteaUrl)) return
            formAction(formData)
          }}
          className="mt-4 space-y-3"
          noValidate
        >
          <div>
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
                  if (urlError) validateUrl(e.target.value)
                }}
                onBlur={(e) => validateUrl(e.target.value)}
                aria-invalid={urlError ? 'true' : 'false'}
                aria-describedby={urlError ? 'giteaUrl-error' : undefined}
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
            {urlError && (
              <p id="giteaUrl-error" role="alert" className="text-xs text-destructive mt-1">
                {urlError}
              </p>
            )}
            {giteaUrl && giteaUrl === rememberedUrl && (
              <p data-testid="last-used-hint" className="text-[10px] text-muted-foreground mt-1">
                {t('lastUsedHint')}
              </p>
            )}
          </div>

          <input
            id="token"
            name="token"
            type="password"
            placeholder={t('tokenPlaceholder')}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
          <p className="text-xs text-muted-foreground">
            {t('tokenHint')}{' '}
            <a
              href={giteaUrl ? `${giteaUrl}/user/settings/applications` : 'https://docs.gitea.com/administration/config-cheat-sheet/'}
              target="_blank"
              rel="noopener"
              data-testid="new-here-get-token"
              className="text-primary hover:underline"
            >
              {t('newHereGetToken')}
            </a>
          </p>

          {state.error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full h-11">
            {pending ? t('submitting') : t('submitPat')}
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
    </AuthShell>
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
