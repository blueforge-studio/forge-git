import { Command } from 'commander'
import chalk from 'chalk'
import { createRepo, createOrgRepo, deleteRepo, listUserRepos, listOrgRepos } from '@forge-git/gitea-bridge'
import type { CreateRepoRequest } from '@forge-git/gitea-bridge'
import { DEFAULT_ORG, getGiteaUrl, setupAuth } from '../lib/auth'

// ─── Init ───────────────────────────────────────────────────────────────────

export const initCmd = new Command('init')
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
    const giteaUrl = getGiteaUrl()
    setupAuth()
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
      const repo = options.org === 'me' ? await createRepo(data) : await createOrgRepo(options.org, data)
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

// ─── List ───────────────────────────────────────────────────────────────────

export const listCmd = new Command('list')
  .description('List repositories')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--user', 'List current user repositories')
  .action(async (options) => {
    setupAuth()
    try {
      const repos = options.user ? await listUserRepos('me') : await listOrgRepos(options.org)
      if (repos.length === 0) {
        console.log(chalk.yellow('No repositories found.'))
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

// ─── Delete ─────────────────────────────────────────────────────────────────

export const deleteCmd = new Command('delete')
  .description('Delete a repository')
  .argument('<name>', 'Repository name')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--yes', 'Skip confirmation prompt', false)
  .action(async (name, options) => {
    setupAuth()
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

// ─── Remote ─────────────────────────────────────────────────────────────────

export const remoteCmd = new Command('remote')
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

// ─── Migrate ────────────────────────────────────────────────────────────────

export const migrateCmd = new Command('migrate')
  .description('Create a repo on forge-git and set it as origin')
  .argument('<path>', 'Local repository path')
  .argument('<name>', 'Repository name on forge-git')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--private', 'Make repository private', true)
  .option('--description <text>', 'Repository description')
  .option('--keep-remote', 'Keep existing origin remote (do not switch)')
  .action(async (repoPath, name, options) => {
    const giteaUrl = getGiteaUrl()
    setupAuth()
    const path = `${giteaUrl}/${options.org}/${name}`

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
      console.log(chalk.green(`✓ Created ${path}`))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('409')) {
        console.error(chalk.red(`Failed to create repository: ${msg}`))
        process.exit(1)
      }
      console.log(chalk.yellow(`  Repository ${options.org}/${name} already exists — using existing.`))
    }

    const cleanUrl = giteaUrl.replace(/^https?:\/\//, '')
    const remoteUrl = `https://${cleanUrl}/${options.org}/${name}.git`

    if (!options.keepRemote) {
      console.log(chalk.blue(`Switching git remote to ${remoteUrl}...`))
      const { execSync } = await import('child_process')
      try {
        execSync('git remote get-url origin', { cwd: repoPath, stdio: 'pipe' })
        execSync(`git remote set-url origin ${remoteUrl}`, { cwd: repoPath })
        console.log(chalk.green('✓ Remote updated'))
      } catch {
        execSync(`git remote add origin ${remoteUrl}`, { cwd: repoPath })
        console.log(chalk.green('✓ Remote added'))
      }
    }

    console.log(chalk.green('\n✓ Migration complete!'))
    console.log(chalk.cyan(`  Repo: ${path}`))
    console.log(chalk.cyan(`  Next: cd ${repoPath} && git push -u origin --all && git push -u origin --tags`))
  })
