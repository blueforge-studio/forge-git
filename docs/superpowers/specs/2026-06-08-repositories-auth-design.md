# forge-git: Repositories & Auth — Design Spec

Date: 2026-06-08
Iteration: 2 (repositories + auth)
Next: 3 (organizations), 4 (settings), 5 (repo detail)

---

## Overview

Wire the web app to Gitea's API via `@forge-git/gitea-bridge`, using per-user
personal access tokens for authentication. This iteration implements the
repositories list and create-repo flow, starting from a login page.

## Auth

### Flow

1. User visits `/login`, enters Gitea instance URL + personal access token
2. Server action calls `GET /api/v1/user` on the Gitea instance to verify the
   token is valid
3. On success: store token + Gitea URL in an httpOnly, Secure, SameSite=Lax
   cookie (encrypted at rest via `next/headers` `cookies().set()`)
4. On failure: return validation error to the form
5. All subsequent server component / server action reads call
   `getSession()` which decrypts the cookie and returns `{ giteaUrl, token }`

### Cookie structure

```
name:  forge-git-session
value: base64(json({ giteaUrl, token }))
flags: httpOnly, Secure (production only), SameSite=Lax, path=/
maxAge: 7 days
```

Stored as a single cookie to keep auth stateless. Encryption is handled by
the framework — cookie values set via `cookies().set()` with `httpOnly` are
not accessible to client-side JS.

### Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/session.ts` | `getSession()` — reads cookie via `next/headers` cookies API, returns `{ giteaUrl, token }` or null |
| `apps/web/src/lib/session.ts` | `createSession(giteaUrl, token)` — sets the cookie |
| `apps/web/src/app/login/page.tsx` | Login form — Gitea URL + token fields |
| `apps/web/src/app/login/actions.ts` | Server action: validate token against Gitea, set cookie on success |

### Middleware consideration

No middleware for this iteration. Pages that require auth check
`getSession()` at the top of the server component and redirect to `/login` if
null. A `middleware.ts` can be added later for blanket route protection.

## Repositories

### Routes

```
/repositories          — server component, lists user's repos
/repositories/new      — client form, creates a repo
```

### Data flow

**List (`/repositories`):**
```
Browser → GET /repositories
  → Server component calls getSession()
  → null? redirect to /login
  → listUserRepos('me', token) via gitea-bridge
  → Renders RepoList → RepoCard[]
  → Static HTML served
```

**Create (`/repositories/new`):**
```
Browser → GET /repositories/new
  → Client component renders CreateRepoForm
  → User fills form, submits
  → Server action createRepo(formData):
      → getSession()
      → null? return error
      → createRepo(data, token) via gitea-bridge
      → revalidatePath('/repositories')
      → redirect('/repositories')
```

### Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `RepoList` | Server | `src/components/repo-list.tsx` | Fetches repos, renders grid |
| `RepoCard` | Client | `src/components/repo-card.tsx` | Single repo card — name, description, visibility badge, clone URL with copy button |
| `CreateRepoForm` | Client | `src/components/create-repo-form.tsx` | Form: name, description, visibility toggle (private/public), gitignore/license selects. Uses `useActionState` for errors |
| `EmptyState` | Server | `src/components/empty-state.tsx` | Reusable — icon, title, description, CTA. Extracted from current `page.tsx` |

### Server actions

`apps/web/src/app/repositories/actions.ts`:
- `createRepo(prevState, formData)` — parses form, calls `gitea-bridge.createRepo()`, returns `{ error?: string }`

### Error states

- **Auth missing:** redirect to `/login`
- **Token expired/invalid:** 401 — show "Your session has expired. Please log in again." with link to `/login`
- **Gitea unreachable:** fetch error — show "Unable to reach Gitea at {url}. Is the server running?" with retry button
- **409 conflict:** repo name taken — show inline error on the name field
- **400 validation:** missing name — show inline error

## Header

Update root layout header to reflect auth state:

- **Not logged in (`getSession() === null`):** Show `/login` link
- **Logged in:** Show repositories, organizations, settings links + user avatar dropdown

Current `layout.tsx` is a server component — it can call `getSession()` at the
top and pass the result to a client `Header` component via props.

## Gitea-bridge changes

Add optional `token` parameter to every exported function. The internal
`request()` helper checks `token ?? getGiteaToken()`. No breaking changes —
CLI and deploy-runner continue working as before.

Example signature change:
```ts
// Before
export async function listUserRepos(username: string): Promise<GiteaRepo[]>

// After
export async function listUserRepos(username: string, token?: string): Promise<GiteaRepo[]>
```

The `giteaUrl` is already configurable via `process.env.GITEA_URL`, but the
web app needs per-session URLs. For web use, pass a `baseUrl` parameter too:

```ts
export async function listUserRepos(username: string, opts?: {
  token?: string
  baseUrl?: string
}): Promise<GiteaRepo[]>
```

The `request()` helper accepts `opts?: { token?, baseUrl? }` which override
`process.env` when provided.

## Remaining routes (design only — future iterations)

| Route | Type | Iteration | Description |
|-------|------|-----------|-------------|
| `/repositories/[owner]/[repo]` | Page | 5 | Repo detail — branches, files, README, settings tabs |
| `/organizations` | Page | 3 | List orgs via `listOrgs()` |
| `/organizations/[name]` | Page | 3 | Org detail — members, teams, repos |
| `/organizations/[name]/repos` | Page | 3 | Org repos via `listOrgRepos()` |
| `/settings` | Page | 4 | User profile + preferences |
| `/settings/tokens` | Page | 4 | Manage personal access tokens |
| `/settings/keys` | Page | 4 | SSH key management via `listRepoKeys()` |

All follow the same pattern: server component → `getSession()` → gitea-bridge → render.

## File tree (this iteration)

```
apps/web/src/
├── app/
│   ├── page.tsx              (updated: extract empty state to component)
│   ├── layout.tsx            (updated: header with auth awareness)
│   ├── globals.css           (unchanged)
│   ├── login/
│   │   ├── page.tsx          (new)
│   │   └── actions.ts        (new)
│   └── repositories/
│       ├── page.tsx          (new: list repos)
│       ├── new/
│       │   └── page.tsx      (new: create repo form)
│       └── actions.ts        (new: createRepo server action)
├── components/
│   ├── header.tsx            (new: auth-aware header)
│   ├── repo-list.tsx         (new: repo grid)
│   ├── repo-card.tsx         (new: single repo card)
│   ├── create-repo-form.tsx  (new: create form)
│   └── empty-state.tsx       (new: reusable empty state)
└── lib/
    └── session.ts            (new: cookie-based session)
```

## What's NOT in scope

- Middleware for blanket route protection (add later)
- Token encryption beyond httpOnly cookie (add later if needed)
- Organization CRUD, settings pages, repo detail (iterations 3-5)
- Deploy-runner integration (separate follow-up)
- Dockerfile for forge-git-api service (removed from docker-compose as it's not needed with this architecture)
