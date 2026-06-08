import AddTeamMemberForm from './add-team-member-form'
import RemoveTeamMemberButton from './remove-team-member-button'
import EditTeamForm from './edit-team-form'
import type { Team, OrgMember } from '@forge-git/gitea-bridge'

interface Props {
  team: Team
  orgName: string
  members: OrgMember[]
}

export default function TeamSidebar({ team, orgName, members }: Props) {
  return (
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
              <RemoveTeamMemberButton teamId={team.id} org={orgName} username={member.login} />
            </div>
          ))}
        </div>
        <AddTeamMemberForm teamId={team.id} org={orgName} />
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Team Settings</h2>
        <EditTeamForm team={team} org={orgName} />
      </div>
    </div>
  )
}
