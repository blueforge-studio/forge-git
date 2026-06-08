import { getSession } from '@/lib/session'
import { getCommit } from '@forge-git/gitea-bridge'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { GitCommit, User, Mail, Calendar } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string; ref: string }>
}

export default async function CommitDetailPage({ params }: Props) {
  const { owner, repo, ref } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let commit
  try {
    commit = await getCommit(owner, repo, ref, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) notFound()
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="commits" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load commit</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="commits" />

      <div className="mb-6">
        <Link
          href={`/repositories/${owner}/${repo}/commits`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Commits
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{commit.commit.message.split('\n')[0]}</h1>
        </div>

        {commit.commit.message.includes('\n') && (
          <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground mb-4 border-t border-border pt-4">
            {commit.commit.message.split('\n').slice(1).join('\n').trim()}
          </pre>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{commit.sha}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3">Author</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{commit.commit.author.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">{commit.commit.author.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(commit.commit.author.date).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3">Committer</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{commit.commit.committer.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">{commit.commit.committer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(commit.commit.committer.date).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
