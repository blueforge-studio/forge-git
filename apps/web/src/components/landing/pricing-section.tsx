import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'
import Link from 'next/link'

const tiers = [
  { key: 'free', href: '/login', highlighted: false },
  { key: 'pro', href: '/login', highlighted: true },
  { key: 'enterprise', href: 'mailto:hello@forge-git.dev', highlighted: false },
]

export default async function PricingSection() {
  const t = await getTranslations('pricing')

  return (
    <section id="pricing" className="py-16" aria-labelledby="pricing-heading" data-testid="pricing-section">
      <div className="text-center mb-10">
        <h2
          id="pricing-heading"
          className="text-2xl font-semibold tracking-tight mb-3"
        >
          {t('heading')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map(({ key, href, highlighted }) => {
          const name = t(`${key}.name`)
          const price = t(`${key}.price`)
          const period = key === 'enterprise' ? undefined : t(`${key}.period`)
          const description = t(`${key}.description`)
          const cta = t(`${key}.cta`)
          const features: string[] = ['feature0', 'feature1', 'feature2', 'feature3', 'feature4', 'feature5']
            .map((fk) => {
              const val = t(`${key}.${fk}`)
              // next-intl returns the key itself when not found
              return val === `${key}.${fk}` ? null : val
            })
            .filter(Boolean) as string[]

          return (
            <div
              key={key}
              className={`relative glass-card p-6 ${
                highlighted
                  ? 'ring-1 ring-primary/30 shadow-[0_0_30px_var(--color-primary)]/10'
                  : ''
              }`}
              data-testid={`pricing-tier-${name.toLowerCase()}`}
            >
              {highlighted && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {t('mostPopular')}
                </span>
              )}

              <h3 className="font-semibold text-sm mb-1 text-foreground dark:text-white">{name}</h3>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-3xl font-bold text-foreground dark:text-white">{price}</span>
                {period && (
                  <span className="text-xs text-muted-foreground">{period}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-5">{description}</p>

              <ul className="space-y-2 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground dark:text-white/70">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`inline-flex items-center justify-center w-full rounded-md h-9 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  highlighted
                    ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                    : 'border border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {cta}
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
