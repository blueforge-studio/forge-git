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
import { initCmd, listCmd, deleteCmd, remoteCmd, migrateCmd } from './commands/repo'
import { webhookCmd } from './commands/webhook'
import { tokenCmd } from './commands/token'

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
