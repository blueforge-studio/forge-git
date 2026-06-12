import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { UserMenu } from '@blueforge-studio/app-kit'
import type { UserMenuItem } from '@blueforge-studio/app-kit'
import { getActiveSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import SignOutButton from './sign-out-button'
import ThemeToggle from './theme-toggle'
import SearchBar from './search-bar'
import NotificationBell from './notification-bell'
import LocaleSelector from './locale-selector'

export default async function Header() {
  const t = await getTranslations('header')
  const session = await getActiveSession()

  let user: { login: string; avatar_url: string; email?: string } | null = null
  if (session) {
    try {
      user = await getCurrentUser(session)
    } catch {
      // token expired — user can re-login
    }
  }

  const userMenuItems: UserMenuItem[] = user
    ? [
        { label: t('userMenu.profile'), href: `/profile/${user.login}` },
        { label: t('userMenu.settings'), href: '/settings' },
        { label: '', divider: true },
      ]
    : []

  return (
    <header className="border-b border-border" data-testid="site-header">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/logo-mark.webp"
            alt={t('brandName')}
            width={24}
            height={24}
            className="rounded"
          />
          <Link href="/" className="font-semibold transition-colors hover:text-primary" data-testid="brand-link">
            {t('brandName')}
          </Link>
        </div>

        <nav className="flex items-center gap-5 text-sm">
          {session ? (
            <>
              <Link href="/repositories" className="transition-colors hover:text-primary">
                {t('nav.repositories')}
              </Link>
              <Link href="/organizations" className="transition-colors hover:text-primary">
                {t('nav.organizations')}
              </Link>
              <Link href="/builds" className="transition-colors hover:text-primary">
                {t('nav.builds')}
              </Link>
              <SearchBar placeholder={t('searchPlaceholder')} />
              <NotificationBell />
              <UserMenu
                name={user?.login ?? t('userMenu.user')}
                email={user?.email ?? undefined}
                avatar={
                  user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="w-7 h-7 rounded-full ring-1 ring-border"
                    />
                  ) : undefined
                }
                items={userMenuItems}
              />
              <LocaleSelector />
              <div data-testid="theme-toggle">
                <ThemeToggle />
              </div>
              <SignOutButton label={t('signOut')} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 transition-colors hover:text-primary"
              >
                <LogIn className="w-4 h-4" />
                {t('signIn')}
              </Link>
              <LocaleSelector />
              <div data-testid="theme-toggle">
                <ThemeToggle />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
