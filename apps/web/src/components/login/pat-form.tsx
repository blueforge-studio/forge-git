'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Key } from 'lucide-react'
import { Button, cn } from '@forge-git/ui'
import type { HealthStatus } from '@/lib/auth/use-url-health'

export interface PatFormProps {
  giteaUrl: string
  urlError: string
  healthStatus: HealthStatus
  rememberedUrl: string
  state: { error: string }
  formAction: (formData: FormData) => void
  pending: boolean
  onValidate: (value: string) => boolean
  onUrlChange: (value: string) => void
}

export default function PatForm({
  giteaUrl,
  urlError,
  healthStatus,
  rememberedUrl,
  state,
  formAction,
  pending,
  onValidate,
  onUrlChange,
}: PatFormProps) {
  const t = useTranslations('login')

  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <Key className="w-3.5 h-3.5" />
        {t('patSummary')}
      </summary>

      <form
        action={(formData) => {
          if (!onValidate(giteaUrl)) return
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
                onUrlChange(e.target.value)
                if (urlError) onValidate(e.target.value)
              }}
              onBlur={(e) => onValidate(e.target.value)}
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
        <p className="text-xs text-muted-foreground mt-1">
          <Link href="/forgot-token" className="text-primary hover:underline">
            {t('forgotGiteaUrl')}
          </Link>
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
  )
}
