import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_COOKIE = 'forge-git-session'

// ─── PAT Session ────────────────────────────────────────────────────────────

export interface Session {
  baseUrl: string
  token: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  // If the cookie contains a dot, it's a signed OAuth session — try that first
  if (raw.includes('.')) {
    const oauth = parseOAuthSessionCookie(raw)
    if (oauth) return { baseUrl: oauth.baseUrl, token: oauth.token }
    return null
  }

  try {
    return JSON.parse(atob(raw)) as Session
  } catch {
    return null
  }
}

export async function createSession(
  baseUrl: string,
  token: string
): Promise<void> {
  const cookieStore = await cookies()
  const value = btoa(JSON.stringify({ baseUrl, token }))
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// ─── OAuth Session ──────────────────────────────────────────────────────────

export interface OAuthSession {
  baseUrl: string
  token: string
  refreshToken?: string
  expiresAt?: number
}

let _secretWarned = false

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  if (!_secretWarned) {
    _secretWarned = true
    console.warn(
      '[forge-git] SESSION_SECRET env var is not set. Using insecure development default.'
    )
  }
  return 'forge-git-dev-secret-do-not-use-in-production'
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret())
    .update(payload, 'utf-8')
    .digest('hex')
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload)
  if (expected.length !== signature.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

function serializeOAuthSession(session: OAuthSession): string {
  const payload = btoa(JSON.stringify(session))
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

function parseOAuthSessionCookie(raw: string): OAuthSession | null {
  const dotIndex = raw.lastIndexOf('.')
  if (dotIndex < 1) return null

  const payload = raw.slice(0, dotIndex)
  const signature = raw.slice(dotIndex + 1)

  if (!signature || !verifySignature(payload, signature)) return null

  try {
    return JSON.parse(atob(payload)) as OAuthSession
  } catch {
    return null
  }
}

export async function createOAuthSession(
  baseUrl: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number,
): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined

  const session: OAuthSession = {
    baseUrl,
    token: accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
  }

  const value = serializeOAuthSession(session)
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn
      ? Math.min(expiresIn, 60 * 60 * 24 * 7)
      : 60 * 60 * 24 * 7,
  })
}

export async function getOAuthSession(): Promise<OAuthSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw || !raw.includes('.')) return null

  const session = parseOAuthSessionCookie(raw)
  if (!session) return null

  if (session.expiresAt && Date.now() > session.expiresAt) return null

  return session
}

export async function getActiveSession(): Promise<Session | null> {
  const oauth = await getOAuthSession()
  if (oauth) return { baseUrl: oauth.baseUrl, token: oauth.token }
  return getSession()
}

export async function clearOAuthSession(): Promise<void> {
  await clearSession()
}
