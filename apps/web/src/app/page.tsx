import Link from 'next/link'
import { Button } from '@forge-git/ui'
import {
  Server,
  GitPullRequest,
  AlertCircle,
  Box,
  FolderGit2,
  GitBranch,
  Users,
  BookOpen,
  Plus,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import HeroSection from '@/components/landing/hero-section'
import FeatureGrid from '@/components/feature-grid'
import HowItWorksSection from '@/components/landing/how-it-works-section'
import PricingSection from '@/components/landing/pricing-section'
import NewsletterSection from '@/components/landing/newsletter-section'
import CtaSection from '@/components/landing/cta-section'
import AppFooter from '@/components/footer'
import DashboardStats from '@/components/dashboard-stats'
import DashboardSections from '@/components/dashboard-sections'
import FirstRunEmptyState from '@/components/first-run-empty-state'
import { getActiveSession } from '@/lib/session'
import { fetchDashboardData } from '@/lib/dashboard-data'

async function DashboardFirstRun() {
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
            icon={Users}
            title={t('secondaryOrgTitle')}
            description={t('secondaryOrgDesc')}
            testId="dashboard-first-run-secondary-org"
          />
          <SecondaryCard
            href="https://docs.gitea.com/user/using-git/"
            icon={BookOpen}
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

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: LucideIcon
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

export default async function HomePage() {
  const session = await getActiveSession()

  if (!session) {
    return (
      <>
        <HeroSection />

        <div className="max-w-5xl mx-auto px-6">
          <FeatureGrid />
          <HowItWorksSection />
          <PricingSection />
          <NewsletterSection />
          <CtaSection />
        </div>

        <AppFooter />
      </>
    )
  }

  // Authenticated — fetch dashboard data with graceful fallbacks
  let dashboard
  let error = ''
  try {
    dashboard = await fetchDashboardData(session)
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.baseUrl}
          </p>
        </div>
        <Button asChild>
          <Link href="/repositories/new">New Repository</Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Unable to load dashboard data: {error}</span>
        </div>
      )}

      {dashboard ? (
        dashboard.repos.length === 0 &&
        dashboard.pulls.length === 0 &&
        dashboard.issues.length === 0 &&
        dashboard.builds.length === 0 ? (
          <DashboardFirstRun />
        ) : (
          <>
            <DashboardStats
              stats={{
                repoCount: dashboard.repoCount,
                prCount: dashboard.prCount,
                issueCount: dashboard.issueCount,
                buildCount: dashboard.buildCount,
              }}
              icons={{
                repo: <FolderGit2 className="w-5 h-5" />,
                pr: <GitPullRequest className="w-5 h-5" />,
                issue: <AlertCircle className="w-5 h-5" />,
                build: <Box className="w-5 h-5" />,
              }}
            />

            <DashboardSections
              repos={dashboard.repos.slice(0, 5)}
              pulls={dashboard.pulls}
              issues={dashboard.issues}
              builds={dashboard.builds}
            />
          </>
        )
      ) : (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Server className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No data available. Create a repository to get started.
          </p>
        </div>
      )}
    </main>
  )
}
