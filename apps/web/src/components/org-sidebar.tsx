import Link from 'next/link'
import { Users, Shield } from 'lucide-react'
import CreateTeamForm from './create-team-form'
import AddMemberForm from './add-member-form'
import RemoveMemberButton from './remove-member-button'
import type { Team, OrgMember } from '@forge-git/gitea-bridge'

interface Props {
  orgName: string
  teams: Team[]
  members: OrgMember[]
}

export default function OrgSidebar({ orgName, teams, members }: Props) {
  return (
    <div className="space-y-6">
      {/* Teams */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Teams
        </h2>
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground">No teams</p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/organizations/${orgName}/teams/${team.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {team.name}
                </Link>
                <span className="text-xs text-muted-foreground capitalize">{team.permission}</span>
              </div>
            ))}
          </div>
        )}
        <CreateTeamForm org={orgName} />
      </div>

      {/* Members */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Members
        </h2>
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
              <RemoveMemberButton org={orgName} username={member.login} />
            </div>
          ))}
        </div>
        <AddMemberForm org={orgName} />
      </div>
    </div>
  )
}
