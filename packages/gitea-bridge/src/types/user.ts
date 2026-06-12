export interface GiteaUser {
  id: number
  login: string
  full_name?: string
  email?: string
  avatar_url: string
  language?: string
  is_admin: boolean
  created_at: string
  last_login?: string
}
