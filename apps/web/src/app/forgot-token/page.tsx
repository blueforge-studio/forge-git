'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, MessageCircle, Search, BookOpen, Clipboard, Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'

const HINT_ICONS = [Mail, MessageCircle, Search, BookOpen] as const
const HINT_KEYS = [
  'whereToFindEmail',
  'whereToFindTeammate',
  'whereToFindHistory',
  'whereToFindWiki',
] as const

export default function ForgotTokenPage() {
  const t = useTranslations('auth.forgotToken')
  const tLogin = useTranslations('login')
  const { url: rememberedUrl } = useGiteaUrlMemory()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AuthShell tagline={t('brandTagline')}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-center">
        {t('headline')}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed text-center mb-6">
        {t('subhead')}
      </p>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('checkBrowserTitle')}
        </h2>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          {mounted && rememberedUrl ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                {t('checkBrowserSaved')}
              </p>
              <UrlCodeBlock url={rememberedUrl} copyLabel={tLogin('copyCode')} copiedLabel={tLogin('copyCodeCopied')} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('checkBrowserEmpty')}
            </p>
          )}
        </div>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('whereToFindTitle')}
        </h2>
        <ul className="space-y-2">
          {HINT_KEYS.map((key, i) => {
            const Icon = HINT_ICONS[i]
            return (
              <li
                key={key}
                data-testid={`hint-${key}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{t(key)}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        <Link href="/login" className="text-primary hover:underline">
          {t('foundItSignIn')}
        </Link>
      </p>
    </AuthShell>
  )
}

function UrlCodeBlock({
  url,
  copyLabel,
  copiedLabel,
}: {
  url: string
  copyLabel: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="bg-background px-2 py-1 rounded text-xs font-mono border border-border">
        {url}
      </code>
      <button
        type="button"
        onClick={onCopy}
        data-testid="copy-code-button"
        aria-label={copyLabel}
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </span>
  )
}
