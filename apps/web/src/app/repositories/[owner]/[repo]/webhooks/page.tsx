import { getSession } from '@/lib/session'
import { listWebhooks } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import RepoSettingsNav from '@/components/repo-settings-nav'
import WebhookList from './webhook-list'
import CreateWebhookForm from './create-webhook-form'
import { CopyButton } from '../copy-button'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function WebhooksPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${protocol}://${host}`
  const webhookUrl = `${baseUrl}/api/webhooks/gitea`

  let webhooks
  try {
    webhooks = await listWebhooks(owner, repo, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <main className="max-w-4xl mx-auto px-6 py-10">
        <RepoSettingsNav owner={owner} repo={repo} activeTab="webhooks" />
        <div className="border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-sm text-destructive mb-2">Unable to load webhooks</p>
          <p className="text-xs text-muted-foreground">{msg}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <RepoSettingsNav owner={owner} repo={repo} activeTab="webhooks" />

      <div className="border border-border rounded-lg p-6 mb-6 bg-secondary/10">
        <h3 className="text-sm font-semibold mb-3">Webhook Setup Guide</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Receiver URL:</span>
            <code className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded break-all">
              {webhookUrl}
            </code>
            <CopyButton url={webhookUrl} />
          </div>
          <p>
            Add this webhook to your Gitea repository at{' '}
            <span className="font-mono text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
              Settings → Webhooks
            </span>
          </p>
          <p>
            Set the environment variable{' '}
            <code className="text-xs font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
              GITEA_WEBHOOK_SECRET
            </code>{' '}
            to sign webhook payloads. Generate one with{' '}
            <code className="text-xs font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
              fgit webhook generate-secret
            </code>
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Webhooks</h2>

      <details className="mb-6 border border-border rounded-lg">
        <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-secondary/30">
          Add Webhook
        </summary>
        <CreateWebhookForm owner={owner} repo={repo} />
      </details>

      {webhooks.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        </div>
      ) : (
        <WebhookList owner={owner} repo={repo} webhooks={webhooks} />
      )}
    </main>
  )
}
