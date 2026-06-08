'use client'

import BuildJobCard, { type BuildJob } from '@/components/build-job-card'

export default function BuildsList({ jobs }: { jobs: BuildJob[] }) {
  if (jobs.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-12 text-center">
        <p className="text-sm text-muted-foreground">No builds yet. Trigger one from a repository page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <BuildJobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
