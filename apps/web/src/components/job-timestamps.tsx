import { relativeTime } from '@/lib/build-utils'

interface Props {
  timestamp?: number
  processedOn?: number
  finishedOn?: number
}

export default function JobTimestamps({ timestamp, processedOn, finishedOn }: Props) {
  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-sm font-semibold mb-2">Timestamps</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-28 shrink-0">Created</dt>
          <dd>
            {timestamp
              ? `${new Date(timestamp).toLocaleString()} (${relativeTime(timestamp)})`
              : '-'}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-28 shrink-0">Processed</dt>
          <dd>
            {processedOn
              ? `${new Date(processedOn).toLocaleString()} (${relativeTime(processedOn)})`
              : '-'}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-28 shrink-0">Finished</dt>
          <dd>
            {finishedOn
              ? `${new Date(finishedOn).toLocaleString()} (${relativeTime(finishedOn)})`
              : '-'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
