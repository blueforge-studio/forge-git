# Repositories & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the web app to Gitea via per-user tokens — login, list repos, create repos.

**Architecture:** Next.js server components read a per-user Gitea token from an httpOnly cookie. Server components call `@forge-git/gitea-bridge` directly (no separate API proxy). Client components use server actions for mutations.

**Tech Stack:** Next.js 16 (Turbopack), React 19, Tailwind v4, TypeScript 5.9, pnpm workspace

---

## File Map

```
Create: apps/web/src/lib/session.ts          — cookie-based session get/set
Create: apps/web/src/components/empty-state.tsx — reusable empty state
Create: apps/web/src/components/header.tsx      — auth-aware nav header
Create: apps/web/src/components/repo-card.tsx   — single repo card
Create: apps/web/src/components/repo-list.tsx   — repo grid (server component)
Create: apps/web/src/components/create-repo-form.tsx — create form (client)
Create: apps/web/src/app/login/page.tsx       — login form page
Create: apps/web/src/app/login/actions.ts     — login server action
Create: apps/web/src/app/repositories/page.tsx — repo list page
Create: apps/web/src/app/repositories/actions.ts — createRepo server action
Create: apps/web/src/app/repositories/new/page.tsx — create repo page

Modify: packages/gitea-bridge/src/index.ts    — add opts param to all functions
Modify: apps/web/src/app/layout.tsx           — use new Header, auth-aware
Modify: apps/web/src/app/page.tsx             — use EmptyState component
```

---

### Task 1: Add opts parameter to gitea-bridge

**Files:**
- Modify: `packages/gitea-bridge/src/index.ts` (entire file)

- [ ] **Step 1: Replace the request helper and all function signatures**

Replace the three private helpers and all exported function signatures to accept an optional `opts` parameter.

The gitea-bridge currently has helpers at the top:
```ts
function getGiteaUrl(): string {
  return process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
}
function getGiteaToken(): string {
  return process.env.GITEA_TOKEN ?? process.env.FORGE_GIT_TOKEN ?? ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getGiteaUrl()}/api/v1${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGiteaToken()}`,
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gitea API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
```

Replace with:
```ts
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

async function request<T>(path: string, opts?: { init?: RequestInit } & GiteaOpts): Promise<T> {
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
```

Then update every exported function signature to accept `opts?: GiteaOpts` and pass it through to `request()`.

Pattern — each function changes from:
```ts
export async function getCurrentUser(): Promise<GiteaUser> {
  return request<GiteaUser>('/user')
}
```
To:
```ts
export async function getCurrentUser(opts?: GiteaOpts): Promise<GiteaUser> {
  return request<GiteaUser>('/user', opts)
}
```

Apply this to all exported functions:
- `getCurrentUser(opts?)`
- `getUser(username, opts?)`
- `listOrgs(opts?)`
- `getOrg(orgName, opts?)`
- `createOrg(data, opts?)`
- `listUserRepos(username, opts?)`
- `listOrgRepos(org, opts?)`
- `getRepo(owner, repo, opts?)`
- `createRepo(data, opts?)`
- `createOrgRepo(org, data, opts?)`
- `deleteRepo(owner, repo, opts?)`
- `listRepoKeys(owner, repo, opts?)`
- `addRepoKey(owner, repo, data, opts?)`
- `deleteRepoKey(owner, repo, keyId, opts?)`
- `listWebhooks(owner, repo, opts?)`
- `createWebhook(owner, repo, data, opts?)`
- `deleteWebhook(owner, repo, hookId, opts?)`
- `getBranchProtection(owner, repo, branch, opts?)`
- `setBranchProtection(owner, repo, branch, data, opts?)`
- `listOrgMembers(org, opts?)`
- `addOrgMember(org, username, opts?)`
- `removeOrgMember(org, username, opts?)`
- `listOrgTeams(org, opts?)`
- `createTeam(org, data, opts?)`

- [ ] **Step 2: Verify CLI still works after changes**

```bash
/Users/kmandrup/Projects/Repos/forge-git/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc --project /Users/kmandrup/Projects/Repos/forge-git/packages/gitea-bridge/tsconfig.json --noEmit 2>&1
```
Expected: exit 0 or pre-existing missing types errors only (no new errors from our changes).
The `@types/node` errors are pre-existing, not from our changes.

- [ ] **Step 3: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add packages/gitea-bridge/src/index.ts
git commit -m "feat(gitea-bridge): add optional token/baseUrl opts to all API functions"
```

---

### Task 2: Create session library

**Files:**
- Create: `apps/web/src/lib/session.ts`

- [ ] **Step 1: Write the session module**

```ts
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'forge-git-session'

export interface Session {
  giteaUrl: string
  token: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(atob(raw)) as Session
  } catch {
    return null
  }
}

export async function createSession(
  giteaUrl: string,
  token: string
): Promise<void> {
  const cookieStore = await cookies()
  const value = btoa(JSON.stringify({ giteaUrl, token }))
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/lib/session.ts
git commit -m "feat(web): add cookie-based session management for gitea auth"
```

---

### Task 3: Create login page and server action

**Files:**
- Create: `apps/web/src/app/login/actions.ts`
- Create: `apps/web/src/app/login/page.tsx`

- [ ] **Step 1: Write the login server action**

```ts
// apps/web/src/app/login/actions.ts
'use server'

import { createSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'

export async function login(prevState: { error?: string }, formData: FormData) {
  const giteaUrl = (formData.get('giteaUrl') as string).trim()
  const token = (formData.get('token') as string).trim()

  if (!giteaUrl) return { error: 'Gitea URL is required' }
  if (!token) return { error: 'Token is required' }

  let url: URL
  try {
    url = new URL(giteaUrl)
    if (!url.protocol.startsWith('http')) throw new Error()
  } catch {
    return { error: 'Invalid URL. Must start with http:// or https://' }
  }

  try {
    await getCurrentUser({ token, baseUrl: giteaUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401')) {
      return { error: 'Invalid token. Check your personal access token in Gitea settings.' }
    }
    return { error: `Cannot reach Gitea: ${msg}` }
  }

  await createSession(giteaUrl, token)
  redirect('/repositories')
}
```

- [ ] **Step 2: Write the login page**

```tsx
// apps/web/src/app/login/page.tsx
'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { Server } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {})

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Server className="w-8 h-8 mx-auto mb-2" />
          <h1 className="text-xl font-semibold">Sign in to forge-git</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect to your Gitea instance
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="giteaUrl">
              Gitea URL
            </label>
            <input
              id="giteaUrl"
              name="giteaUrl"
              type="text"
              placeholder="https://forge-git.blueforge.studio"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="token">
              Personal Access Token
            </label>
            <input
              id="token"
              name="token"
              type="password"
              placeholder="Paste your token"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate one at your Gitea user settings &rarr; Applications
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/app/login/
git commit -m "feat(web): add login page with gitea token auth"
```

---

### Task 4: Create reusable EmptyState component

**Files:**
- Create: `apps/web/src/components/empty-state.tsx`
- Modify: `apps/web/src/app/page.tsx` — extract hardcoded empty state

- [ ] **Step 1: Create EmptyState component**

```tsx
// apps/web/src/components/empty-state.tsx
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-lg font-medium mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update landing page to use EmptyState**

Update `apps/web/src/app/page.tsx` — replace the inline empty state div (lines 38-48) with the component:

```tsx
import { Server } from 'lucide-react'
import Link from 'next/link'
import EmptyState from '@/components/empty-state'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            <span className="font-semibold">forge-git</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/repositories" className="hover:text-primary">Repositories</Link>
            <Link href="/organizations" className="hover:text-primary">Organizations</Link>
            <Link href="/settings" className="hover:text-primary">Settings</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Your Repositories</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your code repositories</p>
          </div>
          <Link
            href="/repositories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            New Repository
          </Link>
        </div>

        <EmptyState
          icon={Server}
          title="No repositories yet"
          description="Create your first repository to start hosting with forge-git"
          actionLabel="Create Repository"
          actionHref="/repositories/new"
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/components/empty-state.tsx apps/web/src/app/page.tsx
git commit -m "feat(web): extract reusable EmptyState component from landing page"
```

---

### Task 5: Create auth-aware Header component

**Files:**
- Create: `apps/web/src/components/header.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create Header server component**

```tsx
// apps/web/src/components/header.tsx
import { Server, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import { getCurrentUser } from '@forge-git/gitea-bridge'
import SignOutButton from './sign-out-button'

export default async function Header() {
  const session = await getSession()

  let user: { login: string; avatar_url: string } | null = null
  if (session) {
    try {
      user = await getCurrentUser(session)
    } catch {
      // token expired — user can re-login
    }
  }

  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          <Link href="/" className="font-semibold hover:text-primary">
            forge-git
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          {session ? (
            <>
              <Link href="/repositories" className="hover:text-primary">
                Repositories
              </Link>
              <Link href="/organizations" className="hover:text-primary">
                Organizations
              </Link>
              <Link href="/settings" className="hover:text-primary">
                Settings
              </Link>
              {user && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  {user.login}
                </span>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 hover:text-primary"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create SignOutButton client component**

```tsx
// apps/web/src/components/sign-out-button.tsx
'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        // clearSession is a server action call from client
        await fetch('/api/auth/signout', { method: 'POST' })
        router.push('/')
        router.refresh()
      }}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
```

- [ ] **Step 3: Create signout API route**

```ts
// apps/web/src/app/api/auth/signout/route.ts
import { clearSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST() {
  await clearSession()
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Update root layout to use Header**

Replace the current `apps/web/src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import './globals.css'
import Header from '@/components/header'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/components/header.tsx \
        apps/web/src/components/sign-out-button.tsx \
        apps/web/src/app/api/auth/signout/route.ts \
        apps/web/src/app/layout.tsx
git commit -m "feat(web): add auth-aware header with sign in/out"
```

---

### Task 6: Create RepoCard component

**Files:**
- Create: `apps/web/src/components/repo-card.tsx`

- [ ] **Step 1: Write RepoCard**

```tsx
// apps/web/src/components/repo-card.tsx
'use client'

import { GitFork, Star, Lock, Globe, Copy, Check } from 'lucide-react'
import type { GiteaRepo } from '@forge-git/gitea-bridge'
import Link from 'next/link'
import { useState } from 'react'

export default function RepoCard({ repo }: { repo: GiteaRepo }) {
  const [copied, setCopied] = useState(false)

  const copyCloneUrl = async () => {
    await navigator.clipboard.writeText(repo.clone_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:border-ring transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Link
          href={`/repositories/${repo.full_name}`}
          className="font-medium text-primary hover:underline"
        >
          {repo.full_name}
        </Link>
        {repo.private ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Globe className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {repo.description && (
        <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" /> {repo.stars_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" /> {repo.forks_count}
        </span>
      </div>

      <button
        onClick={copyCloneUrl}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-500" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> {repo.clone_url}
          </>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/components/repo-card.tsx
git commit -m "feat(web): add repo card component with clone URL copy"
```

---

### Task 7: Create RepoList server component and repositories page

**Files:**
- Create: `apps/web/src/components/repo-list.tsx`
- Create: `apps/web/src/app/repositories/page.tsx`

- [ ] **Step 1: Write RepoList server component**

```tsx
// apps/web/src/components/repo-list.tsx
import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import RepoCard from './repo-card'
import EmptyState from './empty-state'
import { Server } from 'lucide-react'
import Link from 'next/link'

export default async function RepoList({ session }: { session: Session }) {
  let repos
  try {
    repos = await listUserRepos('me', session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="border border-destructive/30 rounded-lg p-8 text-center">
        <p className="text-sm text-destructive mb-2">
          Unable to load repositories
        </p>
        <p className="text-xs text-muted-foreground">{msg}</p>
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title="No repositories yet"
        description="Create your first repository to start hosting with forge-git"
        actionLabel="Create Repository"
        actionHref="/repositories/new"
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write the repositories page**

```tsx
// apps/web/src/app/repositories/page.tsx
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RepoList from '@/components/repo-list'

export default async function RepositoriesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your repositories on {session.giteaUrl}
          </p>
        </div>
        <Link
          href="/repositories/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
        >
          New Repository
        </Link>
      </div>

      <RepoList session={session} />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/components/repo-list.tsx apps/web/src/app/repositories/page.tsx
git commit -m "feat(web): add repositories list page with gitea data"
```

---

### Task 8: Create repo form + server action + page

**Files:**
- Create: `apps/web/src/components/create-repo-form.tsx`
- Create: `apps/web/src/app/repositories/actions.ts`
- Create: `apps/web/src/app/repositories/new/page.tsx`

- [ ] **Step 1: Write the createRepo server action**

```ts
// apps/web/src/app/repositories/actions.ts
'use server'

import { getSession } from '@/lib/session'
import { createRepo } from '@forge-git/gitea-bridge'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createRepoAction(
  prevState: { error?: string; field?: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || undefined
  const isPrivate = formData.get('visibility') === 'private'
  const gitignore = (formData.get('gitignore') as string) || undefined
  const license = (formData.get('license') as string) || undefined

  if (!name) return { error: 'Repository name is required', field: 'name' }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { error: 'Name can only contain letters, numbers, dots, hyphens, and underscores', field: 'name' }
  }

  try {
    await createRepo(
      {
        name,
        description,
        private: isPrivate,
        auto_init: true,
        default_branch: 'main',
        gitignore_template: gitignore,
        license,
      },
      session
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'A repository with this name already exists', field: 'name' }
    }
    return { error: `Failed to create repository: ${msg}` }
  }

  revalidatePath('/repositories')
  redirect('/repositories')
}
```

- [ ] **Step 2: Write CreateRepoForm client component**

```tsx
// apps/web/src/components/create-repo-form.tsx
'use client'

import { useActionState } from 'react'
import { createRepoAction } from '@/app/repositories/actions'

export default function CreateRepoForm() {
  const [state, formAction, pending] = useActionState(createRepoAction, {})

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor="name">
          Repository name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="my-project"
          autoFocus
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {state.field === 'name' && state.error && (
          <p className="text-xs text-destructive mt-1">{state.error}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="Optional description"
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Visibility</label>
        <div className="mt-1 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="public"
              defaultChecked
              className="accent-primary"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="private"
              className="accent-primary"
            />
            Private
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="gitignore">
          .gitignore template
        </label>
        <select
          id="gitignore"
          name="gitignore"
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">None</option>
          <option value="Node">Node</option>
          <option value="Python">Python</option>
          <option value="Go">Go</option>
          <option value="Rust">Rust</option>
          <option value="Java">Java</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="license">
          License
        </label>
        <select
          id="license"
          name="license"
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">None</option>
          <option value="MIT">MIT</option>
          <option value="Apache-2.0">Apache 2.0</option>
          <option value="GPL-3.0">GPL 3.0</option>
        </select>
      </div>

      {state.error && !state.field && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Creating...' : 'Create Repository'}
        </button>
        <a
          href="/repositories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Write the create repo page**

```tsx
// apps/web/src/app/repositories/new/page.tsx
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import CreateRepoForm from '@/components/create-repo-form'

export default async function NewRepoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">Create Repository</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Host a new repository on {session.giteaUrl}
      </p>
      <CreateRepoForm />
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/components/create-repo-form.tsx \
        apps/web/src/app/repositories/actions.ts \
        apps/web/src/app/repositories/new/page.tsx
git commit -m "feat(web): add create repository form and server action"
```

---

### Task 9: Verify build and dev server

- [ ] **Step 1: Run the build**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git/apps/web
pnpm next build 2>&1 | tail -20
```
Expected: Compiled successfully, no errors.

- [ ] **Step 2: Start dev server and test routes**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git/apps/web
pnpm next dev --port 3000 &
sleep 4

# Home page (no auth needed)
curl -s -o /dev/null -w "GET /           %{http_code}\n" http://localhost:3000/

# Login page (no auth needed)
curl -s -o /dev/null -w "GET /login      %{http_code}\n" http://localhost:3000/login

# Auth-gated pages (should redirect to /login)
curl -s -o /dev/null -w "GET /repos      %{http_code}\n" http://localhost:3000/repositories
curl -s -o /dev/null -w "GET /repos/new  %{http_code}\n" http://localhost:3000/repositories/new

kill $(lsof -ti:3000)
```
Expected: `/` and `/login` return 200. `/repositories` and `/repositories/new` redirect (307 or 303) to `/login`.

- [ ] **Step 3: Commit if any build fix was needed**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add <fixed-files>
git commit -m "fix(web): build verification fixes"
```

---

### Task 10: Update landing page to remove inline header

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Simplify landing page (header is now in layout)**

```tsx
// apps/web/src/app/page.tsx
import Link from 'next/link'
import EmptyState from '@/components/empty-state'
import { getSession } from '@/lib/session'
import { Server } from 'lucide-react'

export default async function HomePage() {
  const session = await getSession()

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Your Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your code repositories
          </p>
        </div>
        {session && (
          <Link
            href="/repositories/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90"
          >
            New Repository
          </Link>
        )}
      </div>

      <EmptyState
        icon={Server}
        title={session ? 'No repositories yet' : 'Welcome to forge-git'}
        description={
          session
            ? 'Create your first repository to start hosting with forge-git'
            : 'Sign in with your Gitea token to manage repositories'
        }
        actionLabel={session ? 'Create Repository' : 'Sign in'}
        actionHref={session ? '/repositories/new' : '/login'}
      />
    </main>
  )
}
```

- [ ] **Step 2: Rebuild and verify landing page still works**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git/apps/web
pnpm next build 2>&1 | tail -15
```
Expected: Compiled successfully.

- [ ] **Step 3: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add apps/web/src/app/page.tsx
git commit -m "feat(web): make landing page auth-aware with shared header"
```

---

### Task 11: Remove forge-git-api from docker-compose

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Remove the forge-git-api service and its depends_on references**

Remove the `forge-git-api` service block (lines 26-42 in docker-compose.yml) and the `depends_on: - forge-git-api` references from any other services.

- [ ] **Step 2: Commit**

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
git add docker-compose.yml
git commit -m "chore: remove forge-git-api from docker-compose (not needed with direct gitea calls)"
```
