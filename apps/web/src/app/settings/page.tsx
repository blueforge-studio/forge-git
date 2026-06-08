import { getSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let user
  try {
    user = await getCurrentUser(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <div className="border border-destructive/30 rounded-lg p-8 text-center mt-6">
          <p className="text-sm text-destructive mb-2">Unable to load user profile</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.login} className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{user.full_name || user.login}</h2>
              <p className="text-sm text-muted-foreground">@{user.login}</p>
            </div>
          </div>

          <dl className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <dt className="text-muted-foreground w-20">Email</dt>
                <dd>{user.email}</dd>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <dt className="text-muted-foreground w-20">Role</dt>
              <dd>{user.is_admin ? 'Administrator' : 'User'}</dd>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <dt className="text-muted-foreground w-20">Joined</dt>
              <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
            </div>
            {user.last_login && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <dt className="text-muted-foreground w-20">Last login</dt>
                <dd>{new Date(user.last_login).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Connection info */}
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-3">Connection</h3>
          <div className="flex items-center gap-3 text-sm">
            <dt className="text-muted-foreground">Gitea instance</dt>
            <dd className="font-mono text-xs">{session.giteaUrl}</dd>
          </div>
        </div>
      </div>
    </main>
  )
}
