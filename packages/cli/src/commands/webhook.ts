import { Command } from 'commander'
import chalk from 'chalk'
import { createWebhook } from '@forge-git/gitea-bridge'
import { DEFAULT_ORG, setupAuth } from '../lib/auth'

export const webhookCmd = new Command('webhook')
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
