import { getTranslations } from 'next-intl/server'
import { Server, Users, Rocket } from 'lucide-react'

const steps = [
  { number: 1, icon: Server, key: 'step1' },
  { number: 2, icon: Users, key: 'step2' },
  { number: 3, icon: Rocket, key: 'step3' },
]

export default async function HowItWorksSection() {
  const t = await getTranslations('howItWorks')

  return (
    <section id="how-it-works" className="py-16" aria-labelledby="how-it-works-heading" data-testid="how-it-works-section">
      <div className="text-center mb-10">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-semibold tracking-tight mb-3"
        >
          {t('heading')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map(({ number, icon: Icon, key }) => (
          <div
            key={number}
            className="relative glass-card p-6 pt-10"
            data-testid={`how-it-works-step-${number}`}
          >
            <span className="absolute top-3 right-4 text-5xl font-bold text-muted-foreground/25 select-none">
              {number}
            </span>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-foreground dark:text-white">{t(`${key}.title`)}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(`${key}.description`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
