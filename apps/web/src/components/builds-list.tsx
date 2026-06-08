'use client'

import Link from 'next/link'

interface JobWithState {
  id?: string
  timestamp?: number
  data: unknown
  state: string
}

function statusBadge(state: string) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[state] || colors.waiting}`}>
      {state}
    </span>
  )
}

export default function BuildsList({ jobs }: { jobs: JobWithState[] }) {
  if (jobs.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-12 text-center">
        <p className="text-sm text-muted-foreground">No builds yet. Trigger one from a repository page.</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">ID</th>
            <th className="text-left px-4 py-3 font-medium">Repo</th>
            <th className="text-left px-4 py-3 font-medium">Branch</th>
            <th className="text-left px-4 py-3 font-medium">Commit</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => {
            const data = job.data as Record<string, unknown>
            return (
              <tr key={job.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link href={`/builds/${job.id}`} className="text-primary hover:underline font-mono text-xs">
                    #{job.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{String(data.repoId || '-')}</td>
                <td className="px-4 py-3">{String(data.branch || '-')}</td>
                <td className="px-4 py-3 font-mono text-xs">{String(data.commitSha || '-').slice(0, 7)}</td>
                <td className="px-4 py-3">{statusBadge(job.state)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {job.timestamp ? new Date(job.timestamp).toLocaleString() : '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
