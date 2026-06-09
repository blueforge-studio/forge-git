import { getSession } from '@/lib/session'
import { getUser, listUserRepos, listUserOrgs } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Mail, Shield, Calendar, Server, Star, GitFork, Building2 } from 'lucide-react'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let user, repos, orgs
  try {
    ;[user, repos, orgs] = await Promise.all([
      getUser(username, session),
      listUserRepos(username, session),
      listUserOrgs(username, session),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load user profile</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{username}</span>
      </nav>

      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8">
        <img src={user.avatar_url} alt={user.login} className="w-20 h-20 rounded-full" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{user.full_name || user.login}</h1>
          <p className="text-muted-foreground">@{user.login}</p>
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-4 mb-8">
        {user.email && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />{user.email}
          </span>
        )}
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          {user.is_admin ? 'Administrator' : 'User'}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />Joined {joinedDate}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Server className="w-4 h-4" />
          {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
        </span>
      </div>

      {/* Organizations */}
      {orgs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Organizations</h2>
          <div className="flex flex-wrap gap-2">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/organizations/${org.name}`}
                className="inline-flex items-center gap-2 border border-border rounded-full px-3 py-1.5 text-sm hover:border-ring transition-colors"
              >
                {org.avatar_url ? (
                  <img src={org.avatar_url} alt={org.name} className="w-4 h-4 rounded-full" />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
                {org.full_name || org.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Repositories */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Repositories</h2>
        {repos.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <Server className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No repositories yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/repositories/${repo.full_name}`}
                className="border border-border rounded-lg p-4 hover:border-ring transition-colors block"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-primary">{repo.full_name}</span>
                </div>
                {repo.description && (
                  <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stars_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {repo.forks_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
