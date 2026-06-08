import { getSession } from '@/lib/session'
import { listReleases } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@forge-git/ui'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { Tag, Download } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function ReleasesPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let releases
  try {
    releases = await listReleases(owner, repo, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="releases" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load releases</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="releases" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Releases</h2>
        <Button asChild size="sm">
          <Link href={`/repositories/${owner}/${repo}/releases/new`}>
            <Tag className="w-3.5 h-3.5" />
            New Release
          </Link>
        </Button>
      </div>

      {releases.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Tag className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {releases.map((release) => (
            <Link
              key={release.id}
              href={`/repositories/${owner}/${repo}/releases/${release.id}`}
              className="block border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">{release.name || release.tag_name}</h3>
                    {release.prerelease && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-orange-500/30 text-orange-600 bg-orange-500/10">
                        Pre-release
                      </span>
                    )}
                    {release.draft && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-yellow-500/30 text-yellow-600 bg-yellow-500/10">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {release.published_at
                      ? `Published ${new Date(release.published_at).toLocaleDateString()}`
                      : `Created ${new Date(release.created_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <Download className="w-3.5 h-3.5" />
                  <span>{release.tag_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
