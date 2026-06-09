export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getOAuthConfig(): OAuthConfig {
  return {
    clientId: process.env.GITEA_OAUTH_CLIENT_ID ?? '',
    clientSecret: process.env.GITEA_OAUTH_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GITEA_OAUTH_REDIRECT_URI ??
      'http://localhost:3000/api/auth/callback',
  }
}

export function isOAuthConfigured(): boolean {
  return !!process.env.GITEA_OAUTH_CLIENT_ID
}
