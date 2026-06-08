import { User, Mail, Shield, Calendar } from 'lucide-react'

interface Props {
  avatarUrl?: string
  login: string
  fullName?: string
  email?: string
  isAdmin: boolean
  createdAt: string
  lastLogin?: string
}

export default function ProfileDisplay({
  avatarUrl,
  login,
  fullName,
  email,
  isAdmin,
  createdAt,
  lastLogin,
}: Props) {
  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          <img src={avatarUrl} alt={login} className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">{fullName || login}</h2>
          <p className="text-sm text-muted-foreground">@{login}</p>
        </div>
      </div>

      <dl className="space-y-3 mb-6">
        {email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <dt className="text-muted-foreground w-20">Email</dt>
            <dd>{email}</dd>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <dt className="text-muted-foreground w-20">Role</dt>
          <dd>{isAdmin ? 'Administrator' : 'User'}</dd>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <dt className="text-muted-foreground w-20">Joined</dt>
          <dd>{new Date(createdAt).toLocaleDateString()}</dd>
        </div>
        {lastLogin && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <dt className="text-muted-foreground w-20">Last login</dt>
            <dd>{new Date(lastLogin).toLocaleDateString()}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
