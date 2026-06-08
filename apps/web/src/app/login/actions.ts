'use server'

import { createSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'

export async function login(prevState: { error: string }, formData: FormData) {
  const giteaUrl = (formData.get('giteaUrl') as string).trim()
  const token = (formData.get('token') as string).trim()

  if (!giteaUrl) return { error: 'Gitea URL is required' }
  if (!token) return { error: 'Token is required' }

  let url: URL
  try {
    url = new URL(giteaUrl)
    if (!url.protocol.startsWith('http')) throw new Error()
  } catch {
    return { error: 'Invalid URL. Must start with http:// or https://' }
  }

  try {
    await getCurrentUser({ token, baseUrl: giteaUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401')) {
      return { error: 'Invalid token. Check your personal access token in Gitea settings.' }
    }
    return { error: `Cannot reach Gitea: ${msg}` }
  }

  await createSession(giteaUrl, token)
  redirect('/repositories')
}
