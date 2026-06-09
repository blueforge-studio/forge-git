import { getSession } from '@/lib/session'
import { getOrg, listOrgMembers } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Globe } from 'lucide-react'
import OrgNav from '@/components/org-nav'

interface Props {
  params: Promise<{ name: string }>
}

export default async function OrgProfilePage({ params }: Props) {
  const { name } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let org, members
  try {
    ;[org, members] = await Promise.all([
      getOrg(name, session),
      listOrgMembers(name, session),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">
            Unable to load organization profile
          </p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/organizations" className="hover:text-foreground">
          Organizations
        </Link>
        <span className="mx-2">/</span>
        <span className="text-muted-foreground">{name}</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Profile</span>
      </nav>

      <OrgNav orgName={org.name} activeTab="overview" />

      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        {org.avatar_url ? (
          <img
            src={org.avatar_url}
            alt={org.name}
            className="w-20 h-20 rounded-full"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{org.full_name || org.name}</h1>
          {org.description && (
            <p className="text-sm text-muted-foreground mt-2">{org.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {org.website && (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                {org.website}
              </a>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              {org.visibility}
            </span>
          </div>
        </div>
      </div>

      {/* Members section */}
      <h2 className="text-lg font-semibold mb-4">
        Members ({members.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/users/${member.login}`}
            className="flex items-center gap-3 border border-border rounded-lg p-3 hover:border-ring transition-colors"
          >
            <img
              src={member.avatar_url}
              alt={member.login}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">
                {member.full_name || member.login}
              </p>
              <p className="text-xs text-muted-foreground">@{member.login}</p>
            </div>
          </Link>
        ))}
      </div>

    </main>
  )
}
