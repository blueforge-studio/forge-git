'use client'

import BuildJobCard, { type BuildJob } from '@/components/build-job-card'

export default function BuildsList({ jobs }: { jobs: BuildJob[] }) {
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <BuildJobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
