import Link from 'next/link'
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import { getTranslations } from 'next-intl/server'

export async function FirstRunEmptyState() {
  const t = await getTranslations('repositories.firstRun')

  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <GitBranch
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-1">{t('headline')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('subhead')}</p>

      <Button asChild className="w-full h-11 btn-glow">
        <Link
          href="/repositories/new"
          className="group inline-flex items-center justify-center gap-2"
          data-testid="first-run-primary-cta"
        >
          <Plus className="w-4 h-4" />
          {t('primaryCta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <SecondaryCard
          href="/organizations/new"
          icon={Users}
          title={t('secondaryOrgTitle')}
          description={t('secondaryOrgDesc')}
        />
        <SecondaryCard
          href="https://docs.gitea.com/user/using-git/"
          icon={BookOpen}
          title={t('secondaryLearnTitle')}
          description={t('secondaryLearnDesc')}
          external
        />
      </div>
    </div>
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  external = false,
}: {
  href: string
  icon: typeof Users
  title: string
  description: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid="first-run-secondary-learn"
      >
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid="first-run-secondary-org">
      {content}
    </Link>
  )
}
