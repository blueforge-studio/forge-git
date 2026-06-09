import { User } from 'lucide-react'
import type { Comment } from '@forge-git/gitea-bridge'

interface Props {
  comments: Comment[]
  onDelete?: (id: number) => Promise<void>
}

export default function CommentList({ comments }: Props) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No comments yet.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {c.user.avatar_url ? (
              <img src={c.user.avatar_url} alt={c.user.login} className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium">{c.user.full_name || c.user.login}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString()}
            </span>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans">{c.body}</pre>
        </div>
      ))}
    </div>
  )
}
