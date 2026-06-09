'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea, Select } from '@forge-git/ui'
import { CheckCircle, MessageSquare, XCircle } from 'lucide-react'

interface Props {
  owner: string
  repo: string
  prNumber: number
}

const reviewOptions = [
  { value: 'COMMENT', label: 'Comment', icon: MessageSquare },
  { value: 'APPROVED', label: 'Approve', icon: CheckCircle },
  { value: 'REQUEST_CHANGES', label: 'Request Changes', icon: XCircle },
]

export default function PullReviewForm({ owner, repo, prNumber }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const event = formData.get('event') as string
    const body = (formData.get('body') as string || '').trim()

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, body }),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to submit review' }))
        throw new Error(data.error || 'Failed to submit review')
      }
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
      <Select name="event" required>
        {reviewOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
      <Textarea name="body" placeholder="Review summary (optional)" rows={3} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
