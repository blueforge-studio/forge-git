import { Notification, GiteaOpts, request } from './types'

export async function listNotifications(
  opts?: { unread?: boolean; page?: number; limit?: number } & GiteaOpts
): Promise<Notification[]> {
  const qs = new URLSearchParams()
  if (opts?.unread !== undefined) qs.set('status-types', opts.unread ? 'unread' : 'read')
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.limit) qs.set('limit', String(opts.limit))
  const q = qs.toString()
  return request<Notification[]>(`/notifications${q ? '?' + q : ''}`, opts)
}

export async function markNotificationRead(id: number, opts?: GiteaOpts): Promise<void> {
  return request<void>(`/notifications/${id}`, {
    init: { method: 'PATCH', body: JSON.stringify({ status: 'read' }) },
    ...opts,
  })
}

export async function markAllNotificationsRead(opts?: GiteaOpts): Promise<void> {
  return request<void>('/notifications', {
    init: { method: 'PUT', body: JSON.stringify({ status: 'read' }) },
    ...opts,
  })
}
