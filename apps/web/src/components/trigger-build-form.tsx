'use client'

import { useState, useRef, useEffect } from 'react'
import type { BuildJobData } from '@/lib/queue'
import { Button, Input } from '@forge-git/ui'

interface Props {
  onTriggered?: () => void
  prefill?: Partial<BuildJobData>
}

export default function TriggerBuildForm({ onTriggered, prefill }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobId, setJobId] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!prefill || !formRef.current) return
    const form = formRef.current
    if (prefill.repoId) {
      const el = form.elements.namedItem('repoId') as HTMLInputElement | null
      if (el) el.value = prefill.repoId
    }
    if (prefill.branch) {
      const el = form.elements.namedItem('branch') as HTMLInputElement | null
      if (el) el.value = prefill.branch
    }
    if (prefill.orgId) {
      const el = form.elements.namedItem('orgId') as HTMLInputElement | null
      if (el) el.value = prefill.orgId
    }
  }, [prefill])

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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="repoId"
          type="text"
          placeholder="repoId *"
          required
        />
        <Input
          name="orgId"
          type="text"
          placeholder="orgId *"
          required
        />
        <Input
          name="commitSha"
          type="text"
          placeholder="commitSha *"
          required
        />
        <Input
          name="branch"
          type="text"
          placeholder="branch *"
          required
        />
        <Input
          name="prNumber"
          type="number"
          placeholder="PR number (optional)"
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

      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Triggering...' : 'Trigger Build'}
      </Button>
    </form>
  )
}
