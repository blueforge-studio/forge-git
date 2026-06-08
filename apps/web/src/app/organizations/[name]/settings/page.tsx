import { getSession } from '@/lib/session'
import { getOrg } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import EditOrgForm from '@/components/edit-org-form'

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
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">
        Organization Settings &mdash; {org.full_name || org.name}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your organization profile and visibility
      </p>
      <EditOrgForm org={org} />
    </main>
  )
}
