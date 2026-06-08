import { getSession } from '@/lib/session'
import { getTeam, listTeamMembers, listTeamRepos } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AddTeamMemberForm from '@/components/add-team-member-form'
import RemoveTeamMemberButton from '@/components/remove-team-member-button'
import EditTeamForm from '@/components/edit-team-form'
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
          <h2 className="text-lg font-semibold mb-4">Repositories</h2>
          {repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repositories assigned to this team.</p>
          ) : (
            <div className="grid gap-2">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repositories/${repo.full_name}`}
                  className="border border-border rounded-lg p-3 hover:border-ring transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{repo.full_name}</span>
                  {repo.language && (
                    <span className="text-xs text-muted-foreground">{repo.language}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold mb-3">Members</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.login} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-secondary" />
                    )}
                    <span>{member.full_name || member.login}</span>
                  </div>
                  <RemoveTeamMemberButton teamId={teamId} org={orgName} username={member.login} />
                </div>
              ))}
            </div>
            <AddTeamMemberForm teamId={teamId} org={orgName} />
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Team Settings</h2>
            <EditTeamForm team={team} org={orgName} />
          </div>
        </div>
      </div>
    </main>
  )
}
