import { getSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import EditProfileForm from './edit-profile-form'
import SignOutForm from './sign-out-form'
import ProfileDisplay from '@/components/profile-display'
import ConnectionInfo from '@/components/connection-info'

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

  const maskedToken = session.token
    ? `${session.token.slice(0, 6)}...${session.token.slice(-4)}`
    : ''

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        <ProfileDisplay
          avatarUrl={user.avatar_url}
          login={user.login}
          fullName={user.full_name}
          email={user.email}
          isAdmin={user.is_admin}
          createdAt={user.created_at}
          lastLogin={user.last_login}
        />

        {/* Edit profile */}
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4">Edit Profile</h3>
          <EditProfileForm
            defaults={{
              full_name: user.full_name,
              email: user.email,
            }}
          />
        </div>

        <ConnectionInfo baseUrl={session.baseUrl} maskedToken={maskedToken} />

        {/* Sign out */}
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-3">Session</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Sign out to disconnect from this Gitea instance.
          </p>
          <SignOutForm />
        </div>
      </div>
    </main>
  )
}
