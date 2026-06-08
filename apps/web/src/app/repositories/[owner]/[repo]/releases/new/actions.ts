'use server'

import { getSession } from '@/lib/session'
import { createRelease } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createReleaseAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const tag_name = (formData.get('tag_name') as string).trim()
  const name = (formData.get('name') as string).trim()
  const body = (formData.get('body') as string).trim() || undefined
  const prerelease = formData.get('prerelease') === 'true'
  const draft = formData.get('draft') === 'true'

  if (!tag_name) return { error: 'Tag name is required', field: 'tag_name' }
  if (!name) return { error: 'Release title is required', field: 'name' }

  try {
    await createRelease(owner, repo, { tag_name, name, body, prerelease, draft }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to create release: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/releases`)
  redirect(`/repositories/${owner}/${repo}/releases`)
}
