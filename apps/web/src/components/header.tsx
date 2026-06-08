import { Server, LogIn } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import SignOutButton from './sign-out-button'

export default async function Header() {
  const session = await getSession()

  let user: { login: string; avatar_url: string } | null = null
  if (session) {
    try {
      user = await getCurrentUser(session)
    } catch {
      // token expired — user can re-login
    }
  }

  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          <Link href="/" className="font-semibold hover:text-primary">
            forge-git
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          {session ? (
            <>
              <Link href="/repositories" className="hover:text-primary">
                Repositories
              </Link>
              <Link href="/organizations" className="hover:text-primary">
                Organizations
              </Link>
              <Link href="/builds" className="hover:text-primary">
                Builds
              </Link>
              <Link href="/settings" className="hover:text-primary">
                Settings
              </Link>
              {user && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  {user.login}
                </span>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
