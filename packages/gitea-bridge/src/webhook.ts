import { Webhook, GiteaOpts, request } from './types'

export async function listWebhooks(owner: string, repo: string, opts?: GiteaOpts): Promise<Webhook[]> {
  return request<Webhook[]>(`/repos/${owner}/${repo}/hooks`, opts)
}

export async function createWebhook(owner: string, repo: string, data: {
  type: string
  config: { url: string; content_type: string; secret?: string }
  events?: string[]
  active?: boolean
}, opts?: GiteaOpts): Promise<Webhook> {
  return request<Webhook>(`/repos/${owner}/${repo}/hooks`, {
    init: { method: 'POST', body: JSON.stringify(data) },
    ...opts,
  })
}

export async function deleteWebhook(owner: string, repo: string, hookId: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/repos/${owner}/${repo}/hooks/${hookId}`, {
    init: { method: 'DELETE' },
    ...opts,
  })
}
