import { getSession } from '@/lib/session'
import { listOrgTeams } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import OrgNav from '@/components/org-nav'
import CreateTeamForm from '@/components/create-team-form'
import { Shield } from 'lucide-react'
import { Badge } from '@forge-git/ui'

interface Props {
  params: Promise<{ name: string }>
}

export default async function OrgTeamsPage({ params }: Props) {
  const { name } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let teams
  try {
    teams = await listOrgTeams(name, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load teams</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link
          href="/organizations"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Organizations
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">
        {name} &mdash; Teams
      </h1>
      <OrgNav orgName={name} activeTab="teams" />

      <div className="grid gap-3 md:grid-cols-2 mb-10">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No teams in this organization.
          </p>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/organizations/${name}/teams/${team.id}`}
              className="border border-border rounded-lg p-4 hover:border-ring transition-colors"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{team.name}</p>
                    <Badge
                      variant={
                        team.permission === 'admin'
                          ? 'default'
                          : team.permission === 'write'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {team.permission}
                    </Badge>
                  </div>
                  {team.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {team.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold mb-4">Create Team</h2>
        <div className="max-w-md">
          <CreateTeamForm org={name} />
        </div>
      </div>
    </main>
  )
}
