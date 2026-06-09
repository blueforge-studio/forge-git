import { NextRequest, NextResponse } from 'next/server'
import { getOAuthAuthorizeUrl } from '@forge-git/gitea-bridge'
import { getOAuthConfig } from '@/lib/oauth-config'
import { generatePKCEChallengePair } from '@/lib/pkce'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const giteaUrl =
    request.nextUrl.searchParams.get('giteaUrl') ??
    process.env.GITEA_URL ??
    process.env.FORGE_GIT_URL

  if (!giteaUrl) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'no-gitea-url')
    return NextResponse.redirect(loginUrl)
  }

  const { clientId, redirectUri } = getOAuthConfig()

  if (!clientId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'oauth-not-configured')
    return NextResponse.redirect(loginUrl)
  }

  const { verifier, challenge, state } = await generatePKCEChallengePair()

  const authorizeUrl = getOAuthAuthorizeUrl(
    giteaUrl,
    clientId,
    redirectUri,
    state,
    challenge,
  )

  const response = NextResponse.redirect(authorizeUrl)

  response.cookies.set('forge-git-oauth-state', JSON.stringify({ verifier, state, baseUrl: giteaUrl }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5,
  })

  return response
}
