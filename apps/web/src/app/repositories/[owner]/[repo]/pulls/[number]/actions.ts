'use server'

import { getSession } from '@/lib/session'
import { updatePullRequest, mergePullRequest } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function closePullRequestAction(owner: string, repo: string, number: number) {
  const session = await getSession()
  if (!session) redirect('/login')
  await updatePullRequest(owner, repo, number, { state: 'closed' }, session)
  revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`)
}

export async function reopenPullRequestAction(owner: string, repo: string, number: number) {
  const session = await getSession()
  if (!session) redirect('/login')
  await updatePullRequest(owner, repo, number, { state: 'open' }, session)
  revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`)
}

export async function mergePullRequestAction(owner: string, repo: string, number: number) {
  const session = await getSession()
  if (!session) redirect('/login')
  try {
    await mergePullRequest(owner, repo, number, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg }
  }
  revalidatePath(`/repositories/${owner}/${repo}/pulls/${number}`)
}
