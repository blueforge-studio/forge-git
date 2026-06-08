import { cookies } from 'next/headers'

const SESSION_COOKIE = 'forge-git-session'

export interface Session {
  giteaUrl: string
  token: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(atob(raw)) as Session
  } catch {
    return null
  }
}

export async function createSession(
  giteaUrl: string,
  token: string
): Promise<void> {
  const cookieStore = await cookies()
  const value = btoa(JSON.stringify({ giteaUrl, token }))
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
