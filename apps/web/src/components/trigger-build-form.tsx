'use client'

import { useState } from 'react'

interface Props {
  onTriggered?: () => void
}

export default function TriggerBuildForm({ onTriggered }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobId, setJobId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setJobId('')

    const formData = new FormData(e.currentTarget)
    const body = {
      repoId: formData.get('repoId') as string,
      orgId: formData.get('orgId') as string,
      commitSha: formData.get('commitSha') as string,
      branch: formData.get('branch') as string,
      prNumber: formData.get('prNumber') ? Number(formData.get('prNumber')) : undefined,
    }

    try {
      const res = await fetch('/api/builds/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to trigger build')
      setJobId(data.jobId)
      e.currentTarget.reset()
      onTriggered?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="repoId"
          type="text"
          placeholder="repoId *"
          required
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          name="orgId"
          type="text"
          placeholder="orgId *"
          required
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          name="commitSha"
          type="text"
          placeholder="commitSha *"
          required
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          name="branch"
          type="text"
          placeholder="branch *"
          required
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input
          name="prNumber"
          type="number"
          placeholder="PR number (optional)"
          className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {jobId && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Build triggered: <a href={`/builds/${jobId}`} className="underline font-mono">#{jobId}</a>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Triggering...' : 'Trigger Build'}
      </button>
    </form>
  )
}
