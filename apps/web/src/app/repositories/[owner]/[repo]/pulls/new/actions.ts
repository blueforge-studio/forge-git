'use server'

import { getSession } from '@/lib/session'
import { createPullRequest } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPullRequestAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const title = (formData.get('title') as string).trim()
  const head = (formData.get('head') as string).trim()
  const base = (formData.get('base') as string).trim()
  const body = (formData.get('body') as string).trim() || undefined

  if (!title) return { error: 'Title is required', field: 'title' }
  if (!head) return { error: 'Head branch is required', field: 'head' }
  if (!base) return { error: 'Base branch is required', field: 'base' }

  try {
    await createPullRequest(owner, repo, { title, head, base, body }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to create pull request: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/pulls`)
  redirect(`/repositories/${owner}/${repo}/pulls`)
}
