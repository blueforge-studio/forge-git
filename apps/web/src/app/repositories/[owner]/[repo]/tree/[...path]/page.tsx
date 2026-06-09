import { getSession } from '@/lib/session'
import { getTree, getRepo } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoSettingsNav from '@/components/repo-settings-nav'
import { Folder, File, FileCode, FileJson, FileText, FileImage, FileArchive } from 'lucide-react'

interface Props {
  params: Promise<{ owner: string; repo: string; path: string[] }>
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function filterTreeLevel(entries: Array<{ path: string; type: 'tree' | 'blob'; size: number; sha: string }>, prefix: string) {
  const normalized = prefix.replace(/\/+$/, '') + '/'
  return entries
    .filter((e) => e.path.startsWith(normalized))
    .map((e) => ({ ...e, path: e.path.slice(normalized.length) }))
    .filter((e) => !e.path.includes('/'))
}

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const codeExts = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'rb', 'c', 'cpp', 'h', 'java', 'kt', 'swift', 'scala', 'r', 'dart', 'zig', 'lua', 'elm', 'hs', 'clj', 'ex', 'exs', 'erl', 'jl'])
  const jsonExts = new Set(['json', 'jsonc', 'json5'])
  const imgExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'])
  const archiveExts = new Set(['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'])

  if (codeExts.has(ext)) return FileCode
  if (jsonExts.has(ext)) return FileJson
  if (imgExts.has(ext)) return FileImage
  if (archiveExts.has(ext)) return FileArchive
  if (ext === 'md' || ext === 'txt' || ext === 'pdf') return FileText
  return File
}

export default async function TreeViewPage({ params }: Props) {
  const { owner, repo, path: pathSegments } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const currentDir = pathSegments ? pathSegments.join('/') : ''

  let repoInfo
  try {
    repoInfo = await getRepo(owner, repo, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load repository</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  let entries
  try {
    const tree = await getTree(owner, repo, repoInfo.default_branch, session)
    entries = currentDir ? filterTreeLevel(tree, currentDir) : tree.filter((e) => !e.path.includes('/'))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load files</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  const sorted = entries
    .slice()
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.path.localeCompare(b.path)
    })

  const treeBase = `/repositories/${owner}/${repo}/tree`
  const dirCount = sorted.filter((e) => e.type === 'tree').length
  const fileCount = sorted.filter((e) => e.type === 'blob').length

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="files" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/repositories" className="hover:text-foreground">Repositories</Link>
        <span>/</span>
        <Link href={`/repositories/${owner}`} className="hover:text-foreground">{owner}</Link>
        <span>/</span>
        <Link href={`/repositories/${owner}/${repo}`} className="hover:text-foreground">{repo}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">tree</span>
        {pathSegments.map((segment, i) => {
          const href = `${treeBase}/${pathSegments.slice(0, i + 1).join('/')}`
          const isLast = i === pathSegments.length - 1
          return (
            <span key={href} className="flex items-center gap-1.5">
              <span>/</span>
              {isLast ? (
                <span className="text-foreground font-medium">{segment}</span>
              ) : (
                <Link href={href} className="hover:text-foreground">{segment}</Link>
              )}
            </span>
          )
        })}
      </nav>

      {/* Summary */}
      <p className="text-xs text-muted-foreground mb-3">
        {dirCount} {dirCount === 1 ? 'directory' : 'directories'}, {fileCount} {fileCount === 1 ? 'file' : 'files'}
      </p>

      {/* File listing */}
      {sorted.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <Folder className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">This directory is empty.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-24">Size</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                if (entry.type === 'tree') {
                  const dirHref = currentDir
                    ? `${treeBase}/${currentDir}/${entry.path}`
                    : `${treeBase}/${entry.path}`
                  return (
                    <tr key={entry.sha} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={dirHref} className="flex items-center gap-2 text-foreground hover:text-primary">
                          <Folder className="w-4 h-4 shrink-0 text-sky-500" />
                          <span>{entry.path}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">&mdash;</td>
                    </tr>
                  )
                }
                const blobPath = currentDir ? `${currentDir}/${entry.path}` : entry.path
                const Icon = fileIcon(entry.path)
                return (
                  <tr key={entry.sha} className="border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/repositories/${owner}/${repo}/blob/${entry.sha}?path=${encodeURIComponent(blobPath)}`}
                        className="flex items-center gap-2 text-foreground hover:text-primary"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <span>{entry.path}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                      {humanSize(entry.size)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
