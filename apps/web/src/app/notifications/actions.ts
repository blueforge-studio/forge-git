'use server'

import { getSession } from '@/lib/session'
import { markNotificationRead, markAllNotificationsRead } from '@forge-git/gitea-bridge'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function markRead(id: number) {
  const session = await getSession()
  if (!session) redirect('/login')

  try {
    await markNotificationRead(id, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to mark notification as read: ${msg}`)
  }

  revalidatePath('/notifications')
}

export async function markAllRead() {
  const session = await getSession()
  if (!session) redirect('/login')

  try {
    await markAllNotificationsRead(session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to mark all notifications as read: ${msg}`)
  }

  revalidatePath('/notifications')
}
