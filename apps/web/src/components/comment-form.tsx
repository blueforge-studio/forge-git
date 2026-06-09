'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@forge-git/ui'

interface Props {
  owner: string
  repo: string
  index: number
}

export default function CommentForm({ owner, repo, index }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const body = formData.get('body') as string
    if (!body.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, index, body: body.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to add comment')
      formRef.current?.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <Textarea name="body" placeholder="Write a comment..." rows={3} required />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Posting...' : 'Comment'}
      </Button>
    </form>
  )
}
