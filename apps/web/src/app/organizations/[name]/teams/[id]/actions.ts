'use server'

import { getSession } from '@/lib/session'
import { addTeamMember, removeTeamMember, deleteTeam, updateTeam } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function addTeamMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const teamId = Number(formData.get('teamId'))
  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  if (!username) return { error: 'Username is required', field: 'username' }
  if (!teamId) return { error: 'Team ID is required', field: '' }

  try {
    await addTeamMember(teamId, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) return { error: `User "${username}" not found`, field: 'username' }
    return { error: `Failed to add team member: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}/teams/${teamId}`)
  return { error: '', field: '' }
}

export async function removeTeamMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const teamId = Number(formData.get('teamId'))
  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  if (!teamId) return { error: 'Team ID is required', field: '' }

  try {
    await removeTeamMember(teamId, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to remove team member: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}/teams/${teamId}`)
  return { error: '', field: '' }
}

export async function deleteTeamAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const teamId = Number(formData.get('teamId'))
  const org = (formData.get('org') as string).trim()

  if (!teamId) return { error: 'Team ID is required', field: '' }

  try {
    await deleteTeam(teamId, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to delete team: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  redirect(`/organizations/${org}`)
}

export async function updateTeamAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const teamId = Number(formData.get('teamId'))
  const org = (formData.get('org') as string).trim()
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || undefined
  const permission = (formData.get('permission') as string) || undefined

  if (!teamId) return { error: 'Team ID is required', field: '' }
  if (!name) return { error: 'Team name is required', field: 'name' }

  try {
    const data: { name?: string; description?: string; permission?: 'read' | 'write' | 'admin' } = { name }
    if (description) data.description = description
    if (permission && ['read', 'write', 'admin'].includes(permission)) {
      data.permission = permission as 'read' | 'write' | 'admin'
    }
    await updateTeam(teamId, data, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to update team: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}/teams/${teamId}`)
  return { error: '', field: '' }
}
