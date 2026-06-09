import { getSession } from '@/lib/session'
import { getTeam, listTeamMembers, listTeamRepos } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TeamSidebar from '@/components/team-sidebar'
import TeamRepoManager from '@/components/team-repo-manager'
import { Shield, ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ name: string; id: string }>
}

export default async function TeamDetailPage({ params }: Props) {
  const { name: orgName, id } = await params
  const teamId = Number(id)
  const session = await getSession()
  if (!session) redirect('/login')

  let team, members, repos
  try {
    ;[team, members, repos] = await Promise.all([
      getTeam(teamId, session),
      listTeamMembers(teamId, session),
      listTeamRepos(teamId, session),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load team</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  const permissionColors: Record<string, string> = {
    read: 'bg-blue-100 text-blue-800',
    write: 'bg-amber-100 text-amber-800',
    admin: 'bg-purple-100 text-purple-800',
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href={`/organizations/${orgName}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {orgName}
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize ${
            permissionColors[team.permission] || 'bg-secondary text-secondary-foreground'
          }`}
        >
          {team.permission}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamRepoManager teamId={team.id} orgName={orgName} repos={repos} />
        </div>

        <TeamSidebar team={team} orgName={orgName} members={members} />
      </div>
    </main>
  )
}
