/**
 * Gitea webhook event type definitions.
 *
 * These types represent the JSON payloads Gitea sends to webhook endpoints.
 * See: https://docs.gitea.com/usage/webhooks
 */

export interface GiteaPushEvent {
  ref: string
  before: string
  after: string
  compare_url: string
  commits: Array<{ id: string; message: string; url: string; author: { name: string; email: string } }>
  repository: {
    id: number
    name: string
    full_name: string
    owner: { id: number; login: string; username: string }
  }
  pusher: { id: number; login: string; username: string }
  sender: { id: number; login: string; username: string }
}

export interface GiteaPREvent {
  action: 'opened' | 'closed' | 'reopened' | 'synchronized'
  number: number
  pull_request: {
    id: number
    number: number
    title: string
    state: 'open' | 'closed'
    head: { ref: string; sha: string; repo_id: number }
    base: { ref: string; sha: string; repo_id: number }
    merged: boolean
  }
  repository: { id: number; name: string; full_name: string; owner: { id: number; login: string } }
  sender: { id: number; login: string }
}
