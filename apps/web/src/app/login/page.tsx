'use client'

import { useActionState, Suspense, useEffect, useState } from 'react'
import { login } from './actions'
import { LogIn, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'
import { useUrlHealth } from '@/lib/auth/use-url-health'
import { AuthShell } from '@/components/auth/auth-shell'
import OAuthError from '@/components/login/oauth-error'
import PatForm from '@/components/login/pat-form'
import CodeBlock from '@/components/login/code-block'

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

  const handleUrlChange = (value: string) => {
    setGiteaUrl(value)
    persistUrl(value)
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
        <p className="text-xs text-muted-foreground text-center">
          <Link href="/signup" className="text-primary hover:underline">
            {t('newHereCreateAccount')}
          </Link>
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

      <PatForm
        giteaUrl={giteaUrl}
        urlError={urlError}
        healthStatus={healthStatus}
        rememberedUrl={rememberedUrl}
        state={state}
        formAction={formAction}
        pending={pending}
        onValidate={validateUrl}
        onUrlChange={handleUrlChange}
      />

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
