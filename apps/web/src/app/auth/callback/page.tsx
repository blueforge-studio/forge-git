'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { XCircle } from 'lucide-react'
import { Button } from '@forge-git/ui'
import { AuthShell } from '@/components/auth/auth-shell'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth.callback')
  const tLogin = useTranslations('login')

  const error = searchParams.get('error')
  const status = searchParams.get('status')

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => router.replace('/repositories'), 600)
      return () => clearTimeout(timer)
    }
    if (!error && !status) {
      // No params at all — direct visit. Safety net: redirect to /login after 3s.
      const timer = setTimeout(() => router.replace('/login'), 3000)
      return () => clearTimeout(timer)
    }
  }, [error, status, router])

  let errorMessage = error ? tLogin('oauthError.unknown', { error }) : ''
  if (error) {
    try {
      errorMessage = tLogin(`oauthError.${error}` as never)
    } catch {
      // keep unknown fallback
    }
  }

  if (error) {
    return (
      <div className="text-center" data-testid="callback-error">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('errorHeadline')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {t('errorSubhead')}
        </p>
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 mt-4"
        >
          {errorMessage}
        </p>
        <Button asChild className="mt-6 w-full h-11">
          <Link href="/login" data-testid="callback-try-again">
            {t('tryAgain')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center" data-testid="callback-loading">
      <div
        role="status"
        aria-live="polite"
        className="mx-auto w-10 h-10 rounded-full border-2 border-muted border-t-primary animate-spin mb-4"
      />
      <span className="sr-only">{t('signingInHeadline')}</span>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t('signingInHeadline')}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        {t('signingInSubhead')}
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <AuthShell tagline="">
      <Suspense fallback={null}>
        <CallbackContent />
      </Suspense>
    </AuthShell>
  )
}
