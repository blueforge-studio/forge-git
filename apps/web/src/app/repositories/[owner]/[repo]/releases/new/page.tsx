import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import RepoSettingsNav from '@/components/repo-settings-nav'
import CreateReleaseForm from './create-release-form'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function NewReleasePage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="releases" />

      <h2 className="text-lg font-semibold mb-6">Create Release</h2>

      <CreateReleaseForm owner={owner} repo={repo} />
    </main>
  )
}
