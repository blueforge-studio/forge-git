/**
 * Session management — iron-session backed, compatible with @blueforge-studio/auth-session.
 *
 * Public API is backward-compatible with the old hand-rolled HMAC cookies.
 * New code should use createAuthActions(forgeAuthAdapter) and createAuthMiddleware()
 * from @blueforge-studio/auth-session for full auth flow support.
 */

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { SessionOptions } from 'iron-session'
import {
  createAuthActions,
  createAuthMiddleware,
  configureSession,
  getCookieName,
  type AuthActionOptions,
  type AuthMiddlewareConfig,
} from '@blueforge-studio/auth-session'

export { createAuthActions, createAuthMiddleware, configureSession, getCookieName }
export type { AuthActionOptions, AuthMiddlewareConfig }

// ---------------------------------------------------------------------------
// Session types (backward-compatible)
// ---------------------------------------------------------------------------

export interface Session {
  baseUrl: string
  token: string
}

export interface OAuthSession {
  baseUrl: string
  token: string
  refreshToken?: string
  expiresAt?: number
}

// Extended session data stored in iron-session
interface ForgeSessionData {
  userId?: string
  baseUrl?: string
  token?: string
  refreshToken?: string
  expiresAt?: number
}

const SESSION_COOKIE = 'forge-git-session'

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    'forge-git-dev-secret-that-is-at-least-32-chars-long',
  cookieName: SESSION_COOKIE,
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

// Configure auth-session to use the same cookie name and options
configureSession(sessionOptions)

// ---------------------------------------------------------------------------
// Internal — get iron-session
// ---------------------------------------------------------------------------

async function getForgeSession() {
  const cookieStore = await cookies()
  return getIronSession<ForgeSessionData>(cookieStore, sessionOptions)
}

// ---------------------------------------------------------------------------
// PAT Session (backward-compatible API)
// ---------------------------------------------------------------------------

export async function getSession(): Promise<Session | null> {
  const session = await getForgeSession()
  if (session.token && session.baseUrl) {
    return { baseUrl: session.baseUrl, token: session.token }
  }
  return null
}

export async function createSession(
  baseUrl: string,
  token: string,
): Promise<void> {
  const session = await getForgeSession()
  session.baseUrl = baseUrl
  session.token = token
  await session.save()
}

export async function clearSession(): Promise<void> {
  const session = await getForgeSession()
  session.destroy()
}

// ---------------------------------------------------------------------------
// OAuth Session (backward-compatible API)
// ---------------------------------------------------------------------------

export async function createOAuthSession(
  baseUrl: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number,
): Promise<void> {
  const session = await getForgeSession()
  session.baseUrl = baseUrl
  session.token = accessToken
  if (refreshToken) session.refreshToken = refreshToken
  if (expiresIn) session.expiresAt = Date.now() + expiresIn * 1000
  await session.save()
}

export async function getOAuthSession(): Promise<OAuthSession | null> {
  const session = await getForgeSession()
  if (!session.token || !session.baseUrl) return null
  if (session.expiresAt && Date.now() > session.expiresAt) return null
  return {
    baseUrl: session.baseUrl,
    token: session.token,
    ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}),
    ...(session.expiresAt ? { expiresAt: session.expiresAt } : {}),
  }
}

export async function getActiveSession(): Promise<Session | null> {
  const oauth = await getOAuthSession()
  if (oauth) return { baseUrl: oauth.baseUrl, token: oauth.token }
  return getSession()
}

export async function clearOAuthSession(): Promise<void> {
  await clearSession()
}
