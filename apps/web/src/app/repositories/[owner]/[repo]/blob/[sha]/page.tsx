import { getSession } from '@/lib/session'
import { getBlob } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { CopyButton } from '../../copy-button'

interface Props {
  params: Promise<{ owner: string; repo: string; sha: string }>
  searchParams: Promise<{ path?: string }>
}

export default async function BlobViewPage({ params, searchParams }: Props) {
  const { owner, repo, sha } = await params
  const { path: filename } = await searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let blob
  try {
    blob = await getBlob(owner, repo, sha, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load file</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  const decodedContent = blob.encoding === 'base64'
    ? Buffer.from(blob.content, 'base64').toString('utf-8')
    : blob.content

  const displayName = filename ?? sha.slice(0, 7)
  const parentDir = filename
    ? filename.split('/').slice(0, -1).join('/')
    : ''
  const treeBase = `/repositories/${owner}/${repo}/tree`
  const backHref = parentDir ? `${treeBase}/${parentDir}` : treeBase

  // Detect language from filename for display
  const ext = displayName.split('.').pop()?.toLowerCase() ?? ''
  const langMap: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', jsx: 'JSX',
    json: 'JSON', yaml: 'YAML', yml: 'YAML', md: 'Markdown',
    css: 'CSS', html: 'HTML', sql: 'SQL', sh: 'Shell',
    py: 'Python', rs: 'Rust', go: 'Go', rb: 'Ruby',
    dockerfile: 'Dockerfile',
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />

      <div className="mb-4">
        <Link
          href={backHref}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to files
        </Link>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold font-mono">{displayName}</h2>
            {langMap[ext] && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {langMap[ext]}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {blob.size.toLocaleString()} bytes
            </span>
          </div>
          <CopyButton url={decodedContent} />
        </div>
        <div className="bg-zinc-950 text-zinc-100 p-4 overflow-auto">
          {decodedContent ? (
            <pre className="text-sm font-mono leading-relaxed whitespace-pre">
              <code>{decodedContent}</code>
            </pre>
          ) : (
            <span className="text-zinc-500 text-sm italic">Empty file</span>
          )}
        </div>
      </div>
    </main>
  )
}
