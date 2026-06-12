export interface GiteaOpts {
  token?: string
  baseUrl?: string
}

function getGiteaUrl(baseUrl?: string): string {
  return baseUrl ?? process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
}
function getGiteaToken(token?: string): string {
  return token ?? process.env.GITEA_TOKEN ?? process.env.FORGE_GIT_TOKEN ?? ''
}

export async function request<T>(path: string, opts?: { init?: RequestInit } & GiteaOpts): Promise<T> {
  const url = `${getGiteaUrl(opts?.baseUrl)}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGiteaToken(opts?.token)}`,
      ...opts?.init?.headers,
    },
    ...opts?.init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gitea API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
