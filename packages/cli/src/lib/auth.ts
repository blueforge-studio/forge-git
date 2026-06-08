import chalk from 'chalk'

export const DEFAULT_GITEA_URL = 'https://forge-git.blueforge.studio'
export const DEFAULT_ORG = 'blueforge-studio'

export function getToken(): string {
  const token = process.env.FORGE_GIT_TOKEN
  if (!token) {
    console.error(chalk.red('ERROR: FORGE_GIT_TOKEN env var is required.'))
    console.error('  Get your token at https://forge-git.blueforge.studio/user/settings/applications')
    process.exit(1)
  }
  return token
}

export function getGiteaUrl(): string {
  return process.env.FORGE_GIT_URL ?? DEFAULT_GITEA_URL
}

export function setupAuth(): string {
  const token = getToken()
  process.env.GITEA_TOKEN = token
  process.env.GITEA_URL = getGiteaUrl()
  return token
}
