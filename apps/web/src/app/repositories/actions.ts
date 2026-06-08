'use server'

import { getSession } from '@/lib/session'
import { createRepo, createWebhook, deleteWebhook, addRepoKey, deleteRepoKey, setBranchProtection } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createRepoAction(
  prevState: { error: string; field: string },
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
    return { error: `Failed to create repository: ${msg}`, field: '' }
  }

  revalidatePath('/repositories')
  redirect('/repositories')
}

export async function createWebhookAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const url = (formData.get('url') as string).trim()
  const events = (formData.get('events') as string).trim() || 'push'

  if (!url) return { error: 'Payload URL is required', field: 'url' }

  try {
    new URL(url)
  } catch {
    return { error: 'Invalid URL. Must start with http:// or https://', field: 'url' }
  }

  try {
    await createWebhook(
      owner,
      repo,
      {
        type: 'gitea',
        config: { url, content_type: 'json' },
        events: events.split(',').map((e) => e.trim()).filter(Boolean),
        active: true,
      },
      session
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to create webhook: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/webhooks`)
  return { error: '', field: '' }
}

export async function deleteWebhookAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const hookId = parseInt(formData.get('hookId') as string)

  try {
    await deleteWebhook(owner, repo, hookId, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to delete webhook: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/webhooks`)
  return { error: '', field: '' }
}

export async function addDeployKeyAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const title = (formData.get('title') as string).trim()
  const key = (formData.get('key') as string).trim()
  const readOnly = formData.get('read_only') === 'true'

  if (!title) return { error: 'Title is required', field: 'title' }
  if (!key) return { error: 'SSH key is required', field: 'key' }

  try {
    await addRepoKey(owner, repo, { title, key, read_only: readOnly }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to add deploy key: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/deploy-keys`)
  return { error: '', field: '' }
}

export async function deleteDeployKeyAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const keyId = parseInt(formData.get('keyId') as string)

  try {
    await deleteRepoKey(owner, repo, keyId, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to delete deploy key: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/deploy-keys`)
  return { error: '', field: '' }
}

export async function setBranchProtectionAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const owner = (formData.get('owner') as string).trim()
  const repo = (formData.get('repo') as string).trim()
  const branch = (formData.get('branch') as string).trim()

  const data = {
    rule_name: branch,
    branch_name: branch,
    enable_push: formData.get('enable_push') === 'true',
    enable_push_whitelist: formData.get('enable_push_whitelist') === 'true',
    push_whitelist_usernames: (formData.get('push_whitelist_usernames') as string)
      ?.split(',').map((u) => u.trim()).filter(Boolean),
    enable_merge_whitelist: false,
    enable_status_check: formData.get('enable_status_check') === 'true',
    status_check_contexts: (formData.get('status_check_contexts') as string)
      ?.split(',').map((c) => c.trim()).filter(Boolean),
    require_pull_request: formData.get('require_pull_request') === 'true',
    dismiss_stale_approvals: formData.get('dismiss_stale_approvals') === 'true',
  }

  try {
    await setBranchProtection(owner, repo, branch, data, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to update branch protection: ${msg}`, field: '' }
  }

  revalidatePath(`/repositories/${owner}/${repo}/branch-protection`)
  return { error: '', field: '' }
}
