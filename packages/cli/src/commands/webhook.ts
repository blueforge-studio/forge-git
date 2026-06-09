import { Command } from 'commander'
import chalk from 'chalk'
import crypto from 'crypto'
import { createWebhook } from '@forge-git/gitea-bridge'
import { DEFAULT_ORG, setupAuth } from '../lib/auth'

export const generateSecretCmd = new Command('generate-secret')
  .description('Generate a random webhook secret for GITEA_WEBHOOK_SECRET')
  .action(() => {
    const secret = crypto.randomBytes(32).toString('hex')
    console.log(chalk.green('\nGenerated webhook secret:'))
    console.log(chalk.cyan(`  ${secret}`))
    console.log(chalk.dim('\nSet it as GITEA_WEBHOOK_SECRET in your environment:\n'))
    console.log(chalk.yellow(`  GITEA_WEBHOOK_SECRET=${secret}`))
  })

const addCmd = new Command('add')
  .description('Add a webhook to a repository')
  .argument('<name>', 'Repository name')
  .argument('<url>', 'Webhook target URL')
  .option('--org <org>', 'Organization name', DEFAULT_ORG)
  .option('--events <events>', 'Comma-separated events (push,pull_request,etc)', 'push')
  .action(async (name, url, options) => {
    setupAuth()
    try {
      const webhook = await createWebhook(options.org, name, {
        type: 'gitea',
        config: { url, content_type: 'json' },
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

export const webhookCmd = new Command('webhook')
  .description('Manage webhooks')
  .addCommand(addCmd)
  .addCommand(generateSecretCmd)
