import { getSession } from '@/lib/session'
import { listWebhooks } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import RepoSettingsNav from '@/components/repo-settings-nav'
import WebhookList from './webhook-list'
import CreateWebhookForm from './create-webhook-form'

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function WebhooksPage({ params }: Props) {
  const { owner, repo } = await params
  const session = await getSession()
  if (!session) redirect('/login')

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
