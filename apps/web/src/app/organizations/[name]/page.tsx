import { getSession } from '@/lib/session'
import { getOrg, listOrgMembers, listOrgTeams, listOrgRepos } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoCard from '@/components/repo-card'
import OrgSidebar from '@/components/org-sidebar'
import { Settings } from 'lucide-react'

interface Props {
  params: Promise<{ name: string }>
}

export default async function OrgDetailPage({ params }: Props) {
  const { name } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let org, members, teams, repos
  try {
    ;[org, members, teams, repos] = await Promise.all([
      getOrg(name, session),
      listOrgMembers(name, session),
      listOrgTeams(name, session),
      listOrgRepos(name, session),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load organization</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {org.avatar_url ? (
            <img src={org.avatar_url} alt={org.name} className="w-12 h-12 rounded-full" />
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold">{org.full_name || org.name}</h1>
            {org.description && (
              <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
            )}
          </div>
        </div>
        <Link
          href={`/organizations/${org.name}/settings`}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Organization settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Repositories */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Repositories</h2>
          {repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repositories in this organization.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>

        <OrgSidebar orgName={org.name} teams={teams} members={members} />
      </div>
    </main>
  )
}
