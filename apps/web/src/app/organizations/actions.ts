'use server'

import { getSession } from '@/lib/session'
import { createOrg, addOrgMember, removeOrgMember, createTeam, updateOrg } from '@forge-git/gitea-bridge'
import type { CreateOrgRequest, GiteaOpts } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const full_name = (formData.get('full_name') as string).trim() || undefined
  const description = (formData.get('description') as string).trim() || undefined
  const visibility = (formData.get('visibility') as string) || undefined

  if (!name) return { error: 'Organization name is required', field: 'name' }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { error: 'Name can only contain letters, numbers, dots, hyphens, and underscores', field: 'name' }
  }

  try {
    const data: CreateOrgRequest = { name, full_name, description }
    if (visibility) data.visibility = visibility as 'public' | 'limited' | 'private'
    await createOrg(data, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'An organization with this name already exists', field: 'name' }
    }
    return { error: `Failed to create organization: ${msg}`, field: '' }
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}

export async function addMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  if (!username) return { error: 'Username is required', field: 'username' }

  try {
    await addOrgMember(org, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) {
      return { error: `User "${username}" not found`, field: 'username' }
    }
    return { error: `Failed to add member: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function removeMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  try {
    await removeOrgMember(org, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to remove member: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function createTeamAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || undefined
  const permission = (formData.get('permission') as string) || 'read'

  if (!name) return { error: 'Team name is required', field: 'name' }

  try {
    await createTeam(org, { name, description, permission: permission as 'read' | 'write' | 'admin' }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'A team with this name already exists', field: 'name' }
    }
    return { error: `Failed to create team: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function editOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const full_name = (formData.get('full_name') as string).trim() || undefined
  const description = (formData.get('description') as string).trim() || undefined
  const website = (formData.get('website') as string).trim() || undefined
  const location = (formData.get('location') as string).trim() || undefined
  const visibility = (formData.get('visibility') as string) || undefined

  if (!org) return { error: 'Organization name is required', field: 'org' }

  try {
    const data: {
      full_name?: string; description?: string; website?: string
      location?: string; visibility?: 'public' | 'limited' | 'private'
    } = {}
    if (full_name) data.full_name = full_name
    if (description) data.description = description
    if (website) data.website = website
    if (location) data.location = location
    if (visibility && ['public', 'limited', 'private'].includes(visibility)) {
      data.visibility = visibility as 'public' | 'limited' | 'private'
    }
    await updateOrg(org, data, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to update organization: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  redirect(`/organizations/${org}`)
}

export async function deleteOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const orgName = (formData.get('orgName') as string).trim()

  if (!orgName) return { error: 'Organization name is required', field: 'orgName' }

  try {
    const token = session.token
    const baseUrl = process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
    const url = `${baseUrl}/api/v1/orgs/${orgName}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Gitea API ${res.status}: ${text}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) {
      return { error: 'Organization not found', field: '' }
    }
    return { error: `Failed to delete organization: ${msg}`, field: '' }
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}
