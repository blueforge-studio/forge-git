'use server'

import { getSession } from '@/lib/session'
import { deploymentsQueue } from '@/lib/queue'
import { revalidatePath } from 'next/cache'

export async function retryJobAction(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const job = await deploymentsQueue.getJob(id)
  if (!job) throw new Error('Build job not found')

  const state = await job.getState()
  if (state !== 'failed') throw new Error('Only failed jobs can be retried')

  await job.retry()
  revalidatePath(`/builds/${id}`)
  revalidatePath('/builds')
}

export async function cancelJobAction(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const job = await deploymentsQueue.getJob(id)
  if (!job) throw new Error('Build job not found')

  await job.remove()
  revalidatePath(`/builds/${id}`)
  revalidatePath('/builds')
}
