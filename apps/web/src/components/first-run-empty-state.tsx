import { type LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface FirstRunEmptyStateProps {
  icon: LucideIcon
  namespace: string
  primaryCta: React.ReactNode
  secondaryCards?: React.ReactNode
}

export default async function FirstRunEmptyState({
  icon: Icon,
  namespace,
  primaryCta,
  secondaryCards,
}: FirstRunEmptyStateProps) {
  const t = await getTranslations(namespace)
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Icon
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-1">{t('headline')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('subhead')}</p>
      {primaryCta}
      {secondaryCards && (
        <div className="grid gap-3 sm:grid-cols-2 mt-4" data-testid="secondary-grid">
          {secondaryCards}
        </div>
      )}
    </div>
  )
}
