import { NextRequest, NextResponse } from 'next/server'
import { exchangeOAuthCode, getCurrentUser } from '@forge-git/gitea-bridge'
import { getOAuthConfig } from '@/lib/oauth-config'
import { createOAuthSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const errorParam = request.nextUrl.searchParams.get('error')

  if (errorParam) {
    console.error('[oauth] Gitea returned error:', errorParam)
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', `oauth-${errorParam}`)
    return NextResponse.redirect(callbackUrl)
  }

  if (!code || !state) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-missing-params')
    return NextResponse.redirect(callbackUrl)
  }

  const stateCookie = request.cookies.get('forge-git-oauth-state')
  if (!stateCookie?.value) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-session-expired')
    return NextResponse.redirect(callbackUrl)
  }

  let stateData: { verifier: string; state: string; baseUrl: string }
  try {
    stateData = JSON.parse(stateCookie.value)
  } catch {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-invalid-state')
    return NextResponse.redirect(callbackUrl)
  }

  if (stateData.state !== state) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-state-mismatch')
    return NextResponse.redirect(callbackUrl)
  }

  const { verifier, baseUrl } = stateData
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()

  let tokens: Awaited<ReturnType<typeof exchangeOAuthCode>>
  try {
    tokens = await exchangeOAuthCode(
      baseUrl,
      clientId,
      clientSecret,
      redirectUri,
      code,
      verifier,
    )
  } catch (err) {
    console.error('[oauth] Token exchange failed:', err)
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-exchange-failed')
    return NextResponse.redirect(callbackUrl)
  }

  try {
    await getCurrentUser({ token: tokens.access_token, baseUrl })
  } catch (err) {
    console.error('[oauth] Token validation failed:', err)
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('error', 'oauth-token-invalid')
    return NextResponse.redirect(callbackUrl)
  }

  await createOAuthSession(
    baseUrl,
    tokens.access_token,
    tokens.refresh_token,
    tokens.expires_in,
  )

  const response = NextResponse.redirect(
    new URL('/auth/callback?status=success', request.url),
  )
  response.cookies.set('forge-git-oauth-state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
