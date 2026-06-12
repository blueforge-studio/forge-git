import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import RepoCard from './repo-card'
import FirstRunEmptyState from './first-run-empty-state'

export default async function RepoList({ session }: { session: Session }) {
  let repos
  try {
    repos = await listUserRepos('me', session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="border border-destructive/30 rounded-lg p-8 text-center">
        <p className="text-sm text-destructive mb-2">
          Unable to load repositories
        </p>
        <p className="text-xs text-muted-foreground">{msg}</p>
      </div>
    )
  }

  if (repos.length === 0) {
    const t = await getTranslations('repositories.firstRun')
    return (
      <FirstRunEmptyState
        icon={GitBranch}
        namespace="repositories.firstRun"
        primaryCta={
          <Button asChild className="w-full h-11 btn-glow">
            <Link
              href="/repositories/new"
              data-testid="first-run-primary-cta"
              className="group inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('primaryCta')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
        secondaryCards={
          <>
            <SecondaryCard
              href="/organizations/new"
              icon={Users}
              title={t('secondaryOrgTitle')}
              description={t('secondaryOrgDesc')}
              testId="first-run-secondary-org"
            />
            <SecondaryCard
              href="https://docs.gitea.com/user/using-git/"
              icon={BookOpen}
              title={t('secondaryLearnTitle')}
              description={t('secondaryLearnDesc')}
              testId="first-run-secondary-learn"
              external
            />
          </>
        }
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof Users
  title: string
  description: string
  testId: string
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
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
