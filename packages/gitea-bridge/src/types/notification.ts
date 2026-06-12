export interface Notification {
  id: number
  repository: { id: number; name: string; full_name: string; owner: { login: string } }
  subject: { title: string; url: string; type: string; state: string }
  unread: boolean
  pinned: boolean
  updated_at: string
  created_at: string
}

export interface NotificationCount {
  new: number
}

export interface SearchResult<T> {
  ok: boolean
  data: T[]
}
