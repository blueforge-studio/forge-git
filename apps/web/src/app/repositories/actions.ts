'use server'

import { getSession } from '@/lib/session'
import { createRepo } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createRepoAction(
  prevState: { error?: string; field?: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || undefined
  const isPrivate = formData.get('visibility') === 'private'
  const gitignore = (formData.get('gitignore') as string) || undefined
  const license = (formData.get('license') as string) || undefined

  if (!name) return { error: 'Repository name is required', field: 'name' }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { error: 'Name can only contain letters, numbers, dots, hyphens, and underscores', field: 'name' }
  }

  try {
    await createRepo(
      {
        name,
        description,
        private: isPrivate,
        auto_init: true,
        default_branch: 'main',
        gitignore_template: gitignore,
        license,
      },
      session
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'A repository with this name already exists', field: 'name' }
    }
    return { error: `Failed to create repository: ${msg}` }
  }

  revalidatePath('/repositories')
  redirect('/repositories')
}
