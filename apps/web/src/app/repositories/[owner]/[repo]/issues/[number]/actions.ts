'use server'

import { getSession } from '@/lib/session'
import { updateIssue } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function closeIssueAction(owner: string, repo: string, number: number) {
  const session = await getSession()
  if (!session) redirect('/login')
  await updateIssue(owner, repo, number, { state: 'closed' }, session)
  revalidatePath(`/repositories/${owner}/${repo}/issues/${number}`)
}

export async function reopenIssueAction(owner: string, repo: string, number: number) {
  const session = await getSession()
  if (!session) redirect('/login')
  await updateIssue(owner, repo, number, { state: 'open' }, session)
  revalidatePath(`/repositories/${owner}/${repo}/issues/${number}`)
}
