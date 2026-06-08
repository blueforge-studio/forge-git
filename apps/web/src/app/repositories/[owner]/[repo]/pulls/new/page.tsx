import { getSession } from '@/lib/session'
import { listBranches } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import RepoSettingsNav from '@/components/repo-settings-nav'
import CreatePullRequestForm from './create-pr-form'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function NewPullRequestPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  let branches: string[] = []
  try {
    const list = await listBranches(owner, repo, session)
    branches = list.map((b) => b.name)
  } catch {
    // branches will be empty — user can type manually
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="pull-requests" />

      <h2 className="text-lg font-semibold mb-6">New Pull Request</h2>

      <CreatePullRequestForm owner={owner} repo={repo} branches={branches} />
    </main>
  )
}
