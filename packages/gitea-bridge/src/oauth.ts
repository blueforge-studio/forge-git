/**
 * @forge-git/gitea-bridge
 *
 * OAuth2 helpers for Gitea authentication.
 * Gitea OAuth2 docs: https://docs.gitea.com/development/oauth2-provider
 */

export function getOAuthAuthorizeUrl(
  baseUrl: string,
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${baseUrl}/login/oauth/authorize?${params}`
}

export async function exchangeOAuthCode(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string,
  codeVerifier: string,
): Promise<{
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}> {
  const res = await fetch(`${baseUrl}/login/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OAuth token exchange failed (${res.status}): ${text}`)
  }

  return res.json() as unknown as ReturnType<typeof exchangeOAuthCode>
}
