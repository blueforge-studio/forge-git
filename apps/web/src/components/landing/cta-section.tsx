import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default async function CtaSection() {
  const t = await getTranslations('cta')

  return (
    <section className="py-16" aria-labelledby="cta-heading" data-testid="cta-section">
      <div className="relative border border-border rounded-2xl p-8 md:p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5" />
        <div className="ambient-orb w-80 h-80 -top-20 -right-20 bg-primary" />
        <div className="ambient-orb w-64 h-64 -bottom-16 -left-16 bg-secondary" />
        <div className="relative">
          <h2
            id="cta-heading"
            className="text-2xl font-semibold tracking-tight mb-3"
          >
            <span className="gradient-text">{t('heading')}</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t('description')}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-6 h-10 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
            data-testid="cta-get-started"
          >
            {t('button')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
