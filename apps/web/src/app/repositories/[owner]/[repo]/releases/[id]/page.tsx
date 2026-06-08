import { getSession } from '@/lib/session'
import { getRelease } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { Tag, Download, Archive } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string; id: string }>
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { owner, repo, id } = await params
  const releaseId = parseInt(id, 10)
  const session = await getSession()
  if (!session) redirect('/login')

  let release
  try {
    release = await getRelease(owner, repo, releaseId, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="releases" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load release</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="releases" />

      <div className="mb-6">
        <Link
          href={`/repositories/${owner}/${repo}/releases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Releases
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-xl font-semibold">{release.name || release.tag_name}</h1>
              {release.prerelease && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-600 bg-orange-500/10">
                  Pre-release
                </span>
              )}
              {release.draft && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-600 bg-yellow-500/10">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {release.published_at
                ? `Published ${new Date(release.published_at).toLocaleDateString()}`
                : `Created ${new Date(release.created_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {release.body && (
          <div className="border-t border-border pt-4 mt-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{release.body}</pre>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Tag</dt>
          <dd className="text-sm font-mono">{release.tag_name}</dd>
        </div>
        <div className="border border-border rounded-lg p-4">
          <dt className="text-xs text-muted-foreground mb-1">Created</dt>
          <dd className="text-sm">{new Date(release.created_at).toLocaleDateString()}</dd>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <a
          href={release.zipball_url}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-secondary/30 transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          Download ZIP
        </a>
        <a
          href={release.tarball_url}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-secondary/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download TAR
        </a>
      </div>
    </main>
  )
}
