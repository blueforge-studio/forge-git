'use client'

import type { BuildArtifact } from '@/lib/minio'
import { Download, FileText, Archive } from 'lucide-react'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

function fileIcon(key: string) {
  if (key.endsWith('.json') || key.endsWith('.log')) return <FileText className="h-4 w-4" />
  return <Archive className="h-4 w-4" />
}

function fileName(key: string): string {
  const parts = key.split('/')
  return parts[parts.length - 1] ?? key
}

interface Props {
  artifacts: BuildArtifact[]
  available: boolean
}

export default function BuildArtifactList({ artifacts, available }: Props) {
  if (!available) {
    return (
      <div className="border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-2">Artifacts</h2>
        <p className="text-xs text-muted-foreground">
          Artifacts not available. MinIO storage is not configured.
        </p>
      </div>
    )
  }

  if (artifacts.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-2">Artifacts</h2>
        <p className="text-xs text-muted-foreground">
          No artifacts uploaded for this build.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-sm font-semibold mb-3">Artifacts</h2>
      <ul className="space-y-2">
        {artifacts.map((artifact) => (
          <li key={artifact.key}>
            <a
              href={artifact.downloadUrl ?? '#'}
              download={fileName(artifact.key)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/30 transition-colors group"
            >
              {fileIcon(artifact.key)}
              <span className="text-sm font-mono flex-1 truncate">
                {fileName(artifact.key)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatSize(artifact.size)}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {artifact.lastModified.toLocaleString()}
              </span>
              <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
