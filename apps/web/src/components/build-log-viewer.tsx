'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@forge-git/ui'

export default function BuildLogViewer({ logs, title = 'Logs' }: { logs?: string; title?: string }) {
  const router = useRouter()

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </div>

      {logs ? (
        <pre className="text-xs bg-zinc-950 text-zinc-100 rounded-md p-4 overflow-auto max-h-96 leading-relaxed font-mono whitespace-pre-wrap">
          {logs}
        </pre>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">No logs available</p>
      )}
    </div>
  )
}
