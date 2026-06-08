'use server'

import { getSession } from '@/lib/session'
import { updateCurrentUser } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clearSession } from '@/lib/session'

export async function updateProfileAction(
  prevState: { error: string; field: string; success: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const full_name = (formData.get('full_name') as string).trim() || undefined
  const email = (formData.get('email') as string).trim() || undefined
  const location = (formData.get('location') as string).trim() || undefined
  const website = (formData.get('website') as string).trim() || undefined

  try {
    await updateCurrentUser({ full_name, email, location, website }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to update profile: ${msg}`, field: '', success: '' }
  }

  revalidatePath('/settings')
  return { error: '', field: '', success: 'Profile updated' }
}

export async function signOutAction(): Promise<void> {
  'use server'
  await clearSession()
  redirect('/')
}
