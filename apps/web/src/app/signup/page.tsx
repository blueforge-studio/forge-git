'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Globe, Server, Users, ChevronRight, Key, ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { useGiteaUrlMemory } from '@/lib/auth/use-gitea-url-memory'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const { url: rememberedUrl } = useGiteaUrlMemory()

  const tokenSettingsHref = rememberedUrl
    ? `${rememberedUrl}/user/settings/applications`
    : 'https://docs.gitea.com/administration/config-cheat-sheet/'

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
          {t('step1Title')}
        </h2>
        <OptionCard
          href="https://codeberg.org/user/sign_up"
          icon={<Globe className="w-4 h-4" />}
          title={t('step1PublicTitle')}
          description={t('step1PublicDesc')}
        />
        <OptionCard
          href="https://docs.gitea.com/installation/install-from-binary"
          icon={<Server className="w-4 h-4" />}
          title={t('step1SelfHostTitle')}
          description={t('step1SelfHostDesc')}
        />
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <Users className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{t('step1TeamTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('step1TeamDesc')}</p>
          </div>
        </div>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('step2Title')}
        </h2>
        <a
          href={tokenSettingsHref}
          target="_blank"
          rel="noopener"
          data-testid="open-token-settings"
          className="btn-glow w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium group"
        >
          <Key className="w-4 h-4" />
          {t('step2Cta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        <Link href="/login" className="text-primary hover:underline">
          {t('backToSignIn')}
        </Link>
      </p>
    </AuthShell>
  )
}

function OptionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
    >
      <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  )
}
