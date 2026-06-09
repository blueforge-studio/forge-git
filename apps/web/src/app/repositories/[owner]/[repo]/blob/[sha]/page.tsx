import { getSession } from '@/lib/session'
import { getBlob } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { ArrowLeft } from 'lucide-react'

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
      <main className="max-w-4xl mx-auto px-6 py-10">
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

  // Determine parent tree directory for the back link
  const parentDir = filename
    ? filename.split('/').slice(0, -1).join('/')
    : ''

  const treeBase = `/repositories/${owner}/${repo}/tree`
  const backHref = parentDir ? `${treeBase}/${parentDir}` : treeBase

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />

      <div className="mb-6">
        <Link
          href={backHref}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to files
        </Link>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="border-b border-border bg-secondary/30 px-4 py-2.5">
          <h2 className="text-sm font-semibold font-mono">{displayName}</h2>
        </div>
        <pre className="bg-zinc-950 text-zinc-100 rounded-b-md p-4 overflow-auto font-mono text-sm leading-relaxed">
          {decodedContent || <span className="text-muted-foreground italic">Empty file</span>}
        </pre>
      </div>
    </main>
  )
}
