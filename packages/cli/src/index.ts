#!/usr/bin/env node
import * as path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const result = config({ path: path.resolve(__dirname, '../../.env') })
if (result.error) {
  // silently ignore missing .env in dev
}
import { Command } from 'commander'
import chalk from 'chalk'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import {
  createRepo,
  createOrgRepo,
  getRepo,
  deleteRepo,
  listUserRepos,
  listOrgRepos,
  createWebhook,
  type CreateRepoRequest,
} from '@forge-git/gitea-bridge'

const DEFAULT_GITEA_URL = 'https://forge-git.blueforge.studio'
const DEFAULT_ORG = 'blueforge-studio'

// ─── Auth ──────────────────────────────────────────────────────────────────

function getToken(): string {
  const token = process.env.FORGE_GIT_TOKEN
  if (!token) {
    console.error(chalk.red('ERROR: FORGE_GIT_TOKEN env var is required.'))
    console.error('  Get your token at https://forge-git.blueforge.studio/user/settings/applications')
    process.exit(1)
  }
  return token
}

function getGiteaUrl(): string {
  return process.env.FORGE_GIT_URL ?? DEFAULT_GITEA_URL
}

// ─── Init command ───────────────────────────────────────────────────────────

const initCmd = new Command('init')
  .description('Create a new repository on forge-git')
  .argument('<name>', 'Repository name')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--description <text>', 'Repository description')
  .option('--private', 'Make repository private', true)
  .option('--public', 'Make repository public')
  .option('--gitignore <template>', 'Gitignore template name')
  .option('--license <license>', 'License template name')
  .option('--no-auto-init', 'Skip initializing with a README')
  .action(async (name, options) => {
    const token = getToken()
    const giteaUrl = getGiteaUrl()
    process.env.GITEA_TOKEN = token
    process.env.GITEA_URL = giteaUrl

    console.log(chalk.blue(`Creating repository ${options.org}/${name} on ${giteaUrl}...`))

    const data: CreateRepoRequest = {
      name,
      description: options.description,
      private: options.private ?? true,
      auto_init: options.autoInit !== false,
      default_branch: 'main',
      gitignore_template: options.gitignore,
      license: options.license,
    }

    try {
      let repo
      if (options.org === 'me') {
        repo = await createRepo(data)
      } else {
        repo = await createOrgRepo(options.org, data)
      }
      console.log(chalk.green(`✓ Created ${repo.html_url}`))
      console.log(chalk.cyan(`  Clone URL: ${repo.clone_url}`))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('409')) {
        console.error(chalk.yellow(`Repository ${options.org}/${name} already exists.`))
      } else {
        console.error(chalk.red(`Failed to create repository: ${msg}`))
      }
      process.exit(1)
    }
  })

// ─── List command ──────────────────────────────────────────────────────────

const listCmd = new Command('list')
  .description('List repositories')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--user', 'List current user repositories')
  .action(async (options) => {
    const token = getToken()
    process.env.GITEA_TOKEN = token
    process.env.GITEA_URL = getGiteaUrl()

    try {
      let repos
      if (options.user) {
        repos = await listUserRepos('me')
      } else {
        repos = await listOrgRepos(options.org)
      }
      if (repos.length === 0) {
        console.log(chalk.yellow(`No repositories found.`))
        return
      }
      for (const repo of repos) {
        const vis = repo.private ? chalk.red('private') : chalk.green('public')
        console.log(`  ${chalk.bold(repo.name)} [${vis}] — ${repo.html_url}`)
      }
    } catch (err: unknown) {
      console.error(chalk.red(`Failed to list repositories: ${err instanceof Error ? err.message : String(err)}`))
      process.exit(1)
    }
  })

// ─── Delete command ─────────────────────────────────────────────────────────

const deleteCmd = new Command('delete')
  .description('Delete a repository')
  .argument('<name>', 'Repository name')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--yes', 'Skip confirmation prompt', false)
  .action(async (name, options) => {
    const token = getToken()
    process.env.GITEA_TOKEN = token
    process.env.GITEA_URL = getGiteaUrl()

    if (!options.yes) {
      const { default: readline } = await import('readline')
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      const answer = await new Promise<string>((resolve) => {
        rl.question(chalk.red(`Delete repository ${options.org}/${name}? This cannot be undone. [y/N] `), resolve)
      })
      rl.close()
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.')
        return
      }
    }

    try {
      await deleteRepo(options.org, name)
      console.log(chalk.green(`✓ Deleted ${options.org}/${name}`))
    } catch (err: unknown) {
      console.error(chalk.red(`Failed to delete repository: ${err instanceof Error ? err.message : String(err)}`))
      process.exit(1)
    }
  })

// ─── Webhook command ────────────────────────────────────────────────────────

const webhookCmd = new Command('webhook')
  .description('Add a webhook to a repository')
  .argument('<name>', 'Repository name')
  .argument('<url>', 'Webhook target URL')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--events <events>', 'Comma-separated events (push,pull_request,etc)', 'push')
  .action(async (name, url, options) => {
    const token = getToken()
    process.env.GITEA_TOKEN = token
    process.env.GITEA_URL = getGiteaUrl()

    try {
      const webhook = await createWebhook(options.org, name, {
        type: 'gitea',
        config: {
          url,
          content_type: 'json',
        },
        events: options.events.split(','),
        active: true,
      })
      console.log(chalk.green(`✓ Added webhook ${webhook.id} to ${options.org}/${name}`))
      console.log(chalk.cyan(`  Target: ${url}`))
    } catch (err: unknown) {
      console.error(chalk.red(`Failed to add webhook: ${err instanceof Error ? err.message : String(err)}`))
      process.exit(1)
    }
  })

// ─── Remote command ─────────────────────────────────────────────────────────

const remoteCmd = new Command('remote')
  .description('Print the forge-git remote URL for a repository')
  .argument('<name>', 'Repository name')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--ssh', 'Print SSH URL instead of HTTPS', false)
  .action(async (name, options) => {
    const giteaUrl = getGiteaUrl()
    const cleanUrl = giteaUrl.replace(/^https?:\/\//, '')
    if (options.ssh) {
      console.log(`git@${cleanUrl}:${options.org}/${name}.git`)
    } else {
      console.log(`https://${cleanUrl}/${options.org}/${name}.git`)
    }
  })

// ─── Token command ──────────────────────────────────────────────────────────

const tokenCmd = new Command('token')
  .description('Manage personal access tokens')
  .addCommand(
    new Command('generate')
      .description('Generate a new personal access token via Gitea admin')
      .argument('<username>', 'Gitea username')
      .argument('<name>', 'Token name')
      .option('--host <host>', 'Gitea server hostname or IP', '178.104.233.155')
      .option('--container <container>', 'Gitea Docker container name', 'forge-git_forge-git_1')
      .option('--scopes <scopes>', 'Comma-separated scopes', 'write:repository,read:repository,read:user')
      .action(async (username, name, options) => {
        const { execSync } = await import('child_process')
        const scopesArg = options.scopes.split(',').map((s: string) => s.trim()).join(',')
        const cmd = `ssh root@${options.host} "docker exec -u git ${options.container} gitea admin user generate-access-token --username ${username} --token-name ${name} --scopes ${scopesArg}"`

        console.log(chalk.blue(`Generating token for ${username} on ${options.host}...`))
        try {
          const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 })
          const match = result.match(/Access token was successfully created: (\S+)/)
          if (!match) {
            console.error(chalk.red(`Failed to parse token from output:`))
            console.error(result)
            process.exit(1)
          }
          const token = match[1]
          console.log(chalk.green(`✓ Token created: ${token}`))
          console.log(chalk.cyan(`  Run: export FORGE_GIT_TOKEN=${token}`))
          console.log(chalk.cyan(`  Or visit: https://forge-git.blueforge.studio/user/settings/applications`))
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(chalk.red(`Failed to generate token: ${msg}`))
          process.exit(1)
        }
      })
  )

// ─── Migrate command ────────────────────────────────────────────────────────

const migrateCmd = new Command('migrate')
  .description('Create a repo on forge-git and set it as origin')
  .argument('<path>', 'Local repository path')
  .argument('<name>', 'Repository name on forge-git')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--private', 'Make repository private', true)
  .option('--description <text>', 'Repository description')
  .option('--keep-remote', 'Keep existing origin remote (do not switch)')
  .action(async (path, name, options) => {
    const token = getToken()
    const giteaUrl = getGiteaUrl()
    process.env.GITEA_TOKEN = token
    process.env.GITEA_URL = giteaUrl

    const repoPath = `${giteaUrl}/${options.org}/${name}`

    console.log(chalk.blue(`Creating repository ${options.org}/${name} on ${giteaUrl}...`))

    const data: CreateRepoRequest = {
      name,
      description: options.description,
      private: options.private ?? true,
      auto_init: false,
      default_branch: 'main',
    }

    try {
      await createOrgRepo(options.org, data)
      console.log(chalk.green(`✓ Created ${repoPath}`))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('409')) {
        console.error(chalk.red(`Failed to create repository: ${msg}`))
        process.exit(1)
      }
      console.log(chalk.yellow(`  Repository ${options.org}/${name} already exists — using existing.`))
    }

    // Switch git remote
    const cleanUrl = giteaUrl.replace(/^https?:\/\//, '')
    const remoteUrl = `https://${cleanUrl}/${options.org}/${name}.git`

    if (!options.keepRemote) {
      console.log(chalk.blue(`Switching git remote to ${remoteUrl}...`))
      const { execSync } = await import('child_process')
      try {
        execSync('git remote get-url origin', { cwd: path, stdio: 'pipe' })
        execSync(`git remote set-url origin ${remoteUrl}`, { cwd: path })
        console.log(chalk.green(`✓ Remote updated`))
      } catch {
        execSync(`git remote add origin ${remoteUrl}`, { cwd: path })
        console.log(chalk.green(`✓ Remote added`))
      }
    }

    console.log(chalk.green(`\n✓ Migration complete!`))
    console.log(chalk.cyan(`  Repo: ${repoPath}`))
    console.log(chalk.cyan(`  Next: cd ${path} && git push -u origin --all && git push -u origin --tags`))
  })

// ─── Main program ───────────────────────────────────────────────────────────

const program = new Command()
program
  .name('fgit')
  .description('forge-git CLI — manage repositories on forge-git.blueforge.studio')
  .version('0.1.0')
  .configureOutput({
    writeErr: (str: string) => console.error(chalk.red(str)),
  })

program.addCommand(initCmd)
program.addCommand(listCmd)
program.addCommand(deleteCmd)
program.addCommand(webhookCmd)
program.addCommand(remoteCmd)
program.addCommand(tokenCmd)
program.addCommand(migrateCmd)

program.parse()