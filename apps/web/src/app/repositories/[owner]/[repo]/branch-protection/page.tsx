import { getSession } from '@/lib/session'
import { getBranchProtection } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import RepoSettingsNav from '@/components/repo-settings-nav'
import BranchProtectionForm from './branch-protection-form'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function BranchProtectionPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const branch = 'main' // default, could be a dropdown

  let protection
  try {
    protection = await getBranchProtection(owner, repo, branch, session)
  } catch {
    protection = null
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="branch-protection" />

      <h2 className="text-lg font-semibold mb-4">Branch Protection — {branch}</h2>

      <BranchProtectionForm owner={owner} repo={repo} branch={branch} initialData={protection} />
    </main>
  )
}
