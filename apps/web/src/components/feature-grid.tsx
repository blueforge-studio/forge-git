import { getTranslations } from 'next-intl/server'
import { Server, Play, Users, GitPullRequest, CircleDot, Package } from 'lucide-react'

const featureKeys = [
  { icon: Server, key: 'gitHosting' },
  { icon: GitPullRequest, key: 'pullRequests' },
  { icon: CircleDot, key: 'issueTracking' },
  { icon: Package, key: 'releaseManagement' },
  { icon: Play, key: 'cicdPipeline' },
  { icon: Users, key: 'teamManagement' },
] as const

export default async function FeatureGrid() {
  const t = await getTranslations('features')

  return (
    <section aria-labelledby="features-heading" data-testid="feature-grid" className="pt-8">
      <div className="text-center mb-10">
        <h2
          id="features-heading"
          className="text-2xl font-semibold tracking-tight mb-3"
        >
          {t('heading')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
      {featureKeys.map(({ icon: Icon, key }) => (
        <div
          key={key}
          className="group glass-card p-6"
          data-testid={`feature-card-${key}`}
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm mb-2 text-foreground dark:text-white">{t(`${key}.title`)}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{t(`${key}.description`)}</p>
        </div>
      ))}
    </div>
    </section>
  )
}
