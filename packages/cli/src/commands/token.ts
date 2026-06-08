import { Command } from 'commander'
import chalk from 'chalk'

export const tokenCmd = new Command('token')
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
        const unsafe = /[^a-zA-Z0-9._\-:]/
        if (unsafe.test(options.host) || options.host.length > 255) {
          console.error(chalk.red('Invalid host'))
          process.exit(1)
        }
        if (unsafe.test(options.container)) {
          console.error(chalk.red('Invalid container name'))
          process.exit(1)
        }
        if (/[^a-zA-Z0-9_\-.]/.test(username)) {
          console.error(chalk.red('Invalid username'))
          process.exit(1)
        }
        if (/[^a-zA-Z0-9_\-.]/.test(name)) {
          console.error(chalk.red('Invalid token name'))
          process.exit(1)
        }
        const scopesArg = options.scopes.split(',').map((s: string) => s.trim()).join(',')
        if (/[^a-zA-Z0-9_:]/.test(scopesArg)) {
          console.error(chalk.red('Invalid scopes'))
          process.exit(1)
        }

        const { execSync } = await import('child_process')
        const cmd = `ssh root@${options.host} "docker exec -u git ${options.container} gitea admin user generate-access-token --username ${username} --token-name ${name} --scopes ${scopesArg}"`

        console.log(chalk.blue(`Generating token for ${username} on ${options.host}...`))
        try {
          const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 })
          const match = result.match(/Access token was successfully created: (\S+)/)
          if (!match) {
            console.error(chalk.red('Failed to parse token from output:'))
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
