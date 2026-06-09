import { getSession } from '@/lib/session'
import { getOrg } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import EditOrgForm from '@/components/edit-org-form'
import OrgNav from '@/components/org-nav'
import DeleteOrgButton from '@/components/delete-org-button'

interface Props {
  params: Promise<{ name: string }>
}

export default async function OrgSettingsPage({ params }: Props) {
  const { name } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let org
  try {
    org = await getOrg(name, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load organization settings</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">
        Organization Settings &mdash; {org.full_name || org.name}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your organization profile and visibility
      </p>

      <OrgNav orgName={org.name} activeTab="settings" />

      <div className="max-w-xl mb-12">
        <EditOrgForm org={org} />
      </div>

      <div className="border border-destructive/40 rounded-lg p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this organization and all of its repositories.
          This action cannot be undone.
        </p>
        <DeleteOrgButton orgName={org.name} />
      </div>
    </main>
  )
}
