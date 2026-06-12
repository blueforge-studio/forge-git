'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

export default function OAuthError() {
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
