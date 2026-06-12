import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import FirstRunEmptyState from '@/components/first-run-empty-state'
import SecondaryCard from './secondary-card'

export default async function DashboardFirstRun() {
  const t = await getTranslations('dashboard.firstRun')
  return (
    <FirstRunEmptyState
      icon={GitBranch}
      namespace="dashboard.firstRun"
      primaryCta={
        <Button asChild className="w-full h-11 btn-glow">
          <Link
            href="/repositories/new"
            data-testid="dashboard-first-run-primary-cta"
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
            icon={<Users className="w-5 h-5" />}
            title={t('secondaryOrgTitle')}
            description={t('secondaryOrgDesc')}
            testId="dashboard-first-run-secondary-org"
          />
          <SecondaryCard
            href="https://docs.gitea.com/user/using-git/"
            icon={<BookOpen className="w-5 h-5" />}
            title={t('secondaryLearnTitle')}
            description={t('secondaryLearnDesc')}
            testId="dashboard-first-run-secondary-learn"
            external
          />
        </>
      }
    />
  )
}
