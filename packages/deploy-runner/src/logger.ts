import { publishLog } from './pubsub'

export type LogLevel = 'info' | 'warn' | 'error'

export function log(
  level: LogLevel,
  jobId: string | undefined,
  message: string,
  ...args: unknown[]
): void {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    jobId,
    level,
    message,
  }
  if (args.length > 0) entry.details = args
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.log(output)

  if (jobId) publishLog(jobId, entry)
}

export const logger = {
  info: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('info', jobId, message, ...args),
  warn: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('warn', jobId, message, ...args),
  error: (jobId: string | undefined, message: string, ...args: unknown[]) =>
    log('error', jobId, message, ...args),
}
