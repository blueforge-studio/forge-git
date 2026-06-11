import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight, LogIn, GitBranch, HardDrive, Play } from 'lucide-react'

const stats = [
  { key: 'statSelfHosted', detailKey: 'statSelfHostedDetail', icon: HardDrive },
  { key: 'statOpenSource', detailKey: 'statOpenSourceDetail', icon: GitBranch },
  { key: 'statCicd', detailKey: 'statCicdDetail', icon: Play },
]

export default async function HeroSection() {
  const t = await getTranslations('hero')

  return (
    <section className="relative overflow-hidden" data-testid="hero-section">
      {/* AI-generated dark background */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/hero-bg.webp)' }}
      />
      {/* Subtle dark overlay for text readability without washing out the image */}
      <div className="absolute inset-0 -z-10 bg-black/20" />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-36 md:pb-28">
        <div className="text-center max-w-3xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-3 py-1 text-xs text-white/80 mb-8">
            <GitBranch className="w-3 h-3" />
            {t('pillBadge')}
          </div>

          {/* Heading — white on dark bg in both modes */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white"
            style={{ textShadow: '2px 2px rgba(198,198,198,0.6)' }}
            data-testid="hero-heading"
          >
            {t('heading1')}
            <br />
            <span className="gradient-text">{t('heading2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base text-white/70 max-w-lg mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 mb-16">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 h-11 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
              data-testid="hero-sign-in-cta"
            >
              <LogIn className="w-4 h-4" />
              {t('signInCta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-6 h-11 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              {t('howItWorksCta')}
            </Link>
          </div>

          {/* Stats pills */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {stats.map(({ key, detailKey, icon: Icon }) => (
              <div
                key={key}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-2.5"
              >
                <Icon className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{t(key)}</div>
                  <div className="text-xs text-white/50">{t(detailKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
