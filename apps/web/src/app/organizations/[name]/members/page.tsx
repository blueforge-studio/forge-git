import { getSession } from '@/lib/session'
import { listOrgMembers } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import OrgNav from '@/components/org-nav'
import RemoveMemberButton from '@/components/remove-member-button'
import AddMemberForm from '@/components/add-member-form'

interface Props {
  params: Promise<{ name: string }>
}

export default async function OrgMembersPage({ params }: Props) {
  const { name } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let members
  try {
    members = await listOrgMembers(name, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load members</p>
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
        {name} &mdash; Members
      </h1>
      <OrgNav orgName={name} activeTab="members" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {members.map((member) => (
          <div
            key={member.id}
            className="border border-border rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.login}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {member.full_name || member.login}
                </p>
                <p className="text-xs text-muted-foreground">@{member.login}</p>
              </div>
            </div>
            <RemoveMemberButton org={name} username={member.login} />
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold mb-4">Add Member</h2>
        <div className="max-w-md">
          <AddMemberForm org={name} />
        </div>
      </div>
    </main>
  )
}
