import Link from 'next/link'
import { Github } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { NewsletterForm } from '@blueforge-studio/marketing-kit'

async function handleNewsletter(email: string) {
  'use server'
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/api/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to subscribe')
}

export default async function AppFooter() {
  const t = await getTranslations('footer')

  const navColumns = [
    {
      heading: t('platform.heading'),
      links: [
        { href: '/repositories', label: t('platform.repositories') },
        { href: '/organizations', label: t('platform.organizations') },
        { href: '/builds', label: t('platform.builds') },
        { href: '/login', label: t('platform.signIn') },
      ],
    },
    {
      heading: t('resources.heading'),
      links: [
        { href: 'https://docs.gitea.com', label: t('resources.giteaDocs') },
        { href: 'https://about.gitea.com', label: t('resources.aboutGitea') },
        { href: 'https://github.com/go-gitea/gitea', label: t('resources.github') },
      ],
    },
    {
      heading: t('legal.heading'),
      links: [
        { href: '/privacy', label: t('legal.privacy') },
        { href: '/terms', label: t('legal.terms') },
        { href: '/contact', label: t('legal.contact') },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-muted/50 dark:bg-primary/10" data-testid="site-footer">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold text-sm mb-3 hover:text-primary transition-colors">
              <img
                src="/images/logo-mark.webp"
                alt={t('brandName')}
                width={24}
                height={24}
                className="rounded"
              />
              {t('brandName')}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-xs">
              {t('brandDescription')}
            </p>
            <a
              href="https://github.com/go-gitea/gitea"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              {t('githubLink')}
            </a>
          </div>

          {/* Nav columns */}
          {navColumns.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="font-semibold text-xs text-foreground dark:text-white mb-3">{heading}</h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter column */}
          <div>
            <h3 className="font-semibold text-xs text-foreground dark:text-white mb-3">{t('newsletter.heading')}</h3>
            <NewsletterForm
              onSubmit={handleNewsletter}
              placeholder={t('newsletter.placeholder')}
              submitLabel={t('newsletter.submit')}
            />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            {t('by')}{' '}
            <a
              href="https://blueforge.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <img
                src="/images/blueforge-logo.webp"
                alt={t('studioName')}
                width={16}
                height={16}
                className="rounded-sm"
              />
              {t('studioName')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
