/**
 * @forge-git/gitea-bridge
 *
 * Types for build artifacts stored in MinIO (S3-compatible).
 */

export interface BuildArtifact {
  key: string
  size: number
  lastModified: Date
  downloadUrl?: string
}

export interface BuildLog {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
  steps: Array<{ name: string; status: 'success' | 'failed'; duration: number }>
}
