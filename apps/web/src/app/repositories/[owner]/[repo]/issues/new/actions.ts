'use server'

import { getSession } from '@/lib/session'
import { createIssue } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createIssueAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const title = (formData.get('title') as string).trim()
  const body = (formData.get('body') as string).trim() || undefined

  if (!title) return { error: 'Title is required', field: 'title' }

  try {
    await createIssue(owner, repo, { title, body }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to create issue: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/issues`)
  redirect(`/repositories/${owner}/${repo}/issues`)
}
