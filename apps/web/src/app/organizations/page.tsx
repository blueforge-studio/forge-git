import { getSession } from '@/lib/session'
import { listOrgs } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EmptyState from '@/components/empty-state'
import { Building2, Plus } from 'lucide-react'

export default async function OrganizationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let orgs
  try {
    orgs = await listOrgs(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">Organizations</h1>
        <div className="border border-destructive/30 rounded-lg p-8 text-center mt-6">
          <p className="text-sm text-destructive mb-2">Unable to load organizations</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organizations you belong to on {session.baseUrl}
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Organization
        </Link>
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations"
          description="You are not a member of any organizations yet."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.name}`}
              className="border border-border rounded-lg p-4 hover:border-ring transition-colors"
            >
              <div className="flex items-center gap-3">
                {org.avatar_url ? (
                  <img src={org.avatar_url} alt={org.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{org.full_name || org.name}</p>
                  {org.description && (
                    <p className="text-xs text-muted-foreground">{org.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
