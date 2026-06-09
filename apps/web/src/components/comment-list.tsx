'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Trash2, Pencil, Check, X } from 'lucide-react'
import { Button, Textarea } from '@forge-git/ui'
import { timeAgo } from '@/lib/notification-utils'
import type { Comment } from '@forge-git/gitea-bridge'

interface Props {
  comments: Comment[]
  owner: string
  repo: string
}

export default function CommentList({ comments: initialComments, owner, repo }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleDelete(id: number) {
    setLoading(id)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete')
      setComments((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id)
    setEditBody(comment.body)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditBody('')
  }

  async function handleEdit(id: number) {
    if (!editBody.trim()) return
    setLoading(id)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, id, body: editBody.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, body: editBody.trim(), updated_at: new Date().toISOString() } : c))
      )
      setEditingId(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No comments yet.</p>
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-destructive">{error}</p>}
      {comments.map((c) => (
        <div key={c.id} className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {c.user.avatar_url ? (
                <img src={c.user.avatar_url} alt={c.user.login} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">{c.user.full_name || c.user.login}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startEdit(c)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
                aria-label="Edit comment"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={loading === c.id}
                className="p-1 text-muted-foreground hover:text-destructive rounded disabled:opacity-50"
                aria-label="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {editingId === c.id ? (
            <div className="space-y-2">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleEdit(c.id)} disabled={loading === c.id}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {loading === c.id ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap font-sans">{c.body}</pre>
          )}
        </div>
      ))}
    </div>
  )
}
