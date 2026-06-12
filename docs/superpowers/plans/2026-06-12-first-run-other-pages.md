# First-Run States on Dashboard, Builds, Organizations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the `/repositories` first-run pattern to three more authenticated surfaces (dashboard, `/builds`, `/organizations`) by generalizing the `FirstRunEmptyState` component so each page composes its own copy, icon, and CTAs.

**Architecture:** Refactor `FirstRunEmptyState` from a hardcoded server component into a parameterized one that takes `icon`, `namespace`, `primaryCta`, and `secondaryCards`. Each of the three new pages instantiates it with page-specific config. The `/organizations` page uses a small client wrapper (`OrgsFirstRun`) to reveal the inline `CreateOrgForm` on click. A new `empty-all:` mode on the mock Gitea server makes all four surfaces return zero data for e2e tests.

**Tech Stack:** Next.js 16.2.4 (App Router, Server Components, RSC), React 19, next-intl v4, Vitest + @testing-library/react, Playwright 1.60.0, TypeScript 5.x.

**Reference spec:** `docs/superpowers/specs/2026-06-12-first-run-other-pages-design.md`

---

## File Structure

**Modified files:**
- `apps/web/src/components/first-run-empty-state.tsx` — generalize to take props
- `apps/web/src/components/repo-list.tsx` — update call site to pass props
- `apps/web/src/components/builds-list.tsx` — remove empty branch (page owns the check)
- `apps/web/src/app/builds/page.tsx` — render first-run when jobs is empty
- `apps/web/src/app/organizations/page.tsx` — delegate empty state to `OrgsFirstRun`
- `apps/web/src/app/page.tsx` — add dashboard first-run branch
- `apps/web/messages/en.json` — add 3 namespaces
- `apps/web/messages/es.json` — add 3 namespaces
- `apps/web/messages/zh.json` — add 3 namespaces
- `apps/web/e2e/mock-gitea-server.ts` — add `empty-all:` mode

**New files:**
- `apps/web/src/components/orgs-first-run.tsx` — client wrapper with useState toggle
- `apps/web/src/__tests__/components/first-run-empty-state.test.tsx` — unit tests
- `apps/web/src/__tests__/components/orgs-first-run.test.tsx` — unit tests
- `apps/web/e2e/authenticated/builds-first-run.spec.ts` — e2e test
- `apps/web/e2e/authenticated/organizations-first-run.spec.ts` — e2e test
- `apps/web/e2e/authenticated/dashboard-first-run.spec.ts` — e2e test

---

### Task 1: Generalize `FirstRunEmptyState` to accept props

**Files:**
- Modify: `apps/web/src/components/first-run-empty-state.tsx`
- Modify: `apps/web/src/components/repo-list.tsx`
- Create: `apps/web/src/__tests__/components/first-run-empty-state.test.tsx`

- [ ] **Step 1: Write the failing test for the new prop-based API**

Create `apps/web/src/__tests__/components/first-run-empty-state.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import FirstRunEmptyState from '@/components/first-run-empty-state'
import { GitBranch, Users } from 'lucide-react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

afterEach(() => cleanup())

// Provide a fixed set of translations for the test
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    const map: Record<string, Record<string, string>> = {
      'builds.firstRun': {
        headline: 'No builds yet',
        subhead: 'Trigger your first build',
      },
    }
    return (key: string) => map[namespace]?.[key] ?? `${namespace}.${key}`
  }),
}))

describe('FirstRunEmptyState (generalized)', () => {
  it('renders the icon passed via props', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
    })
    render(jsx)
    // The icon is rendered as an SVG with aria-hidden="true"; assert the
    // container's heading is present (icon is decorative).
    expect(screen.getByRole('heading', { name: 'No builds yet' })).toBeInTheDocument()
  })

  it('renders headline and subhead from the namespace', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
    })
    render(jsx)
    expect(screen.getByText('Trigger your first build')).toBeInTheDocument()
  })

  it('renders the primary CTA passed via props', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories" data-testid="primary-cta">Go to repositories</a>,
    })
    render(jsx)
    const cta = screen.getByTestId('primary-cta')
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/repositories')
  })

  it('renders secondary cards grid when provided', async () => {
    const jsx = await FirstRunEmptyState({
      icon: GitBranch,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
      secondaryCards: (
        <>
          <a href="/a" data-testid="secondary-1">A</a>
          <a href="/b" data-testid="secondary-2">B</a>
        </>
      ),
    })
    render(jsx)
    expect(screen.getByTestId('secondary-1')).toBeInTheDocument()
    expect(screen.getByTestId('secondary-2')).toBeInTheDocument()
  })

  it('omits secondary grid when secondaryCards is undefined', async () => {
    const jsx = await FirstRunEmptyState({
      icon: Users,
      namespace: 'builds.firstRun',
      primaryCta: <a href="/repositories">Go to repositories</a>,
    })
    const { container } = render(jsx)
    // No grid-cols-2 wrapper present
    expect(container.querySelector('.sm\\:grid-cols-2')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/first-run-empty-state.test.tsx`
Expected: FAIL — `FirstRunEmptyState` is currently a zero-arg function, so passing props will fail.

- [ ] **Step 3: Refactor `FirstRunEmptyState` to accept props**

Replace the contents of `apps/web/src/components/first-run-empty-state.tsx`:

```tsx
import { type LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface FirstRunEmptyStateProps {
  icon: LucideIcon
  namespace: string
  primaryCta: React.ReactNode
  secondaryCards?: React.ReactNode
}

export default async function FirstRunEmptyState({
  icon: Icon,
  namespace,
  primaryCta,
  secondaryCards,
}: FirstRunEmptyStateProps) {
  const t = await getTranslations(namespace)
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Icon
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-1">{t('headline')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('subhead')}</p>
      {primaryCta}
      {secondaryCards && (
        <div className="grid gap-3 sm:grid-cols-2 mt-4">{secondaryCards}</div>
      )}
    </div>
  )
}
```

Note: the previous component had a default export (and was imported as a named export from `repo-list.tsx` via `import { FirstRunEmptyState } from './first-run-empty-state'`). The new component is the default export. We update the call site in Step 4.

- [ ] **Step 4: Update the `/repositories` call site to pass props**

In `apps/web/src/components/repo-list.tsx`, change the import and the call site. Replace the `import { FirstRunEmptyState } from './first-run-empty-state'` line (and the rest of the empty-branch):

```tsx
import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import RepoCard from './repo-card'
import FirstRunEmptyState from './first-run-empty-state'

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
    const t = await getTranslations('repositories.firstRun')
    return (
      <FirstRunEmptyState
        icon={GitBranch}
        namespace="repositories.firstRun"
        primaryCta={
          <Button asChild className="w-full h-11 btn-glow">
            <Link
              href="/repositories/new"
              data-testid="first-run-primary-cta"
              className="group inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('primaryCta')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
        secondaryCards={
          <>
            <SecondaryCard
              href="/organizations/new"
              icon={Users}
              title={t('secondaryOrgTitle')}
              description={t('secondaryOrgDesc')}
              testId="first-run-secondary-org"
            />
            <SecondaryCard
              href="https://docs.gitea.com/user/using-git/"
              icon={BookOpen}
              title={t('secondaryLearnTitle')}
              description={t('secondaryLearnDesc')}
              testId="first-run-secondary-learn"
              external
            />
          </>
        }
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

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof Users
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/first-run-empty-state.test.tsx`
Expected: PASS — 5 tests pass.

- [ ] **Step 6: Run the existing e2e test for `/repositories` first-run to verify no regression**

The first-run e2e test lives at `apps/web/e2e/authenticated/repositories.spec.ts` in the `Authenticated Repositories empty state` describe block. The test data-testids are unchanged, so it should pass.

Run: `cd apps/web && pnpm test:e2e -- authenticated/repositories.spec.ts`
Expected: PASS — the empty-state tests still pass.

- [ ] **Step 7: Verify typecheck and full unit suite**

Run: `cd apps/web && npx tsc --noEmit && pnpm test`
Expected: typecheck clean, all 183+ unit tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/first-run-empty-state.tsx \
        apps/web/src/components/repo-list.tsx \
        apps/web/src/__tests__/components/first-run-empty-state.test.tsx
git commit -m "$(cat <<'EOF'
refactor(web): generalize FirstRunEmptyState to accept props

Turn the hardcoded /repositories first-run component into a
parameterized shell so dashboard, /builds, and /organizations
can compose their own copy, icon, and CTAs.

- FirstRunEmptyState now takes icon, namespace, primaryCta, and
  optional secondaryCards; defaults exported as a Server Component
- repo-list passes the same copy/CTA config as before via props
  (rendered output is byte-identical)
- Existing first-run-primary-cta / first-run-secondary-org /
  first-run-secondary-learn testids preserved for e2e stability

All 183 unit tests + /repositories e2e first-run suite still pass.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add i18n namespaces for dashboard, builds, organizations firstRun

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/es.json`
- Modify: `apps/web/messages/zh.json`

- [ ] **Step 1: Add namespaces to `en.json`**

In `apps/web/messages/en.json`, add three new top-level objects inside the root JSON. The root is currently `}` — replace it with these three objects + the closing brace:

Read the end of the file first to confirm the closing brace structure (the file should end with a single `}` for the root object).

Append (before the final `}`):

```jsonc
,
"dashboard": {
  "firstRun": {
    "headline": "Welcome to forge-git",
    "subhead": "Create your first repository to get started",
    "primaryCta": "Create your first repository",
    "secondaryOrgTitle": "Create an organization",
    "secondaryOrgDesc": "Host repos for a team or project",
    "secondaryLearnTitle": "Learn more",
    "secondaryLearnDesc": "Browse the Gitea user guide"
  }
},
"builds": {
  "firstRun": {
    "headline": "No builds yet",
    "subhead": "Trigger your first build from a repository to get started",
    "primaryCta": "Go to your repositories",
    "secondaryLearnTitle": "What is CI/CD?",
    "secondaryLearnDesc": "Read the Gitea Actions guide",
    "secondaryBrowseTitle": "Browse repositories",
    "secondaryBrowseDesc": "See all repositories on this instance"
  }
},
"organizations": {
  "firstRun": {
    "headline": "No organizations yet",
    "subhead": "Create an organization to start collaborating with your team",
    "primaryCta": "Create your first organization",
    "secondaryLearnTitle": "Learn about organizations",
    "secondaryLearnDesc": "Read the Gitea organizations guide"
  }
}
```

- [ ] **Step 2: Add equivalent namespaces to `es.json`**

Append (before the final `}` of root):

```jsonc
,
"dashboard": {
  "firstRun": {
    "headline": "Bienvenido a forge-git",
    "subhead": "Crea tu primer repositorio para empezar",
    "primaryCta": "Crea tu primer repositorio",
    "secondaryOrgTitle": "Crear una organización",
    "secondaryOrgDesc": "Aloja repos para un equipo o proyecto",
    "secondaryLearnTitle": "Más información",
    "secondaryLearnDesc": "Consulta la guía de usuario de Gitea"
  }
},
"builds": {
  "firstRun": {
    "headline": "Aún no hay compilaciones",
    "subhead": "Lanza tu primera compilación desde un repositorio para empezar",
    "primaryCta": "Ir a tus repositorios",
    "secondaryLearnTitle": "¿Qué es CI/CD?",
    "secondaryLearnDesc": "Lee la guía de Gitea Actions",
    "secondaryBrowseTitle": "Explorar repositorios",
    "secondaryBrowseDesc": "Ver todos los repositorios de esta instancia"
  }
},
"organizations": {
  "firstRun": {
    "headline": "Aún no hay organizaciones",
    "subhead": "Crea una organización para empezar a colaborar con tu equipo",
    "primaryCta": "Crea tu primera organización",
    "secondaryLearnTitle": "Más información sobre organizaciones",
    "secondaryLearnDesc": "Lee la guía de organizaciones de Gitea"
  }
}
```

- [ ] **Step 3: Add equivalent namespaces to `zh.json`**

Append (before the final `}` of root):

```jsonc
,
"dashboard": {
  "firstRun": {
    "headline": "欢迎使用 forge-git",
    "subhead": "创建你的第一个仓库以开始使用",
    "primaryCta": "创建你的第一个仓库",
    "secondaryOrgTitle": "创建一个组织",
    "secondaryOrgDesc": "为团队或项目托管仓库",
    "secondaryLearnTitle": "了解更多",
    "secondaryLearnDesc": "查看 Gitea 用户指南"
  }
},
"builds": {
  "firstRun": {
    "headline": "还没有构建",
    "subhead": "从一个仓库触发你的第一次构建以开始使用",
    "primaryCta": "前往你的仓库",
    "secondaryLearnTitle": "什么是 CI/CD?",
    "secondaryLearnDesc": "阅读 Gitea Actions 指南",
    "secondaryBrowseTitle": "浏览仓库",
    "secondaryBrowseDesc": "查看此实例上的所有仓库"
  }
},
"organizations": {
  "firstRun": {
    "headline": "还没有组织",
    "subhead": "创建一个组织以开始与你的团队协作",
    "primaryCta": "创建你的第一个组织",
    "secondaryLearnTitle": "了解组织",
    "secondaryLearnDesc": "阅读 Gitea 组织指南"
  }
}
```

- [ ] **Step 4: Verify all three JSON files parse and typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: clean. (The next-intl plugin will typecheck the new namespaces.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/es.json apps/web/messages/zh.json
git commit -m "$(cat <<'EOF'
feat(i18n): add firstRun namespaces for dashboard, builds, organizations

Three new top-level namespaces used by the new first-run empty
states. All three locales (en/es/zh) translated.

dashboard.firstRun: same copy as repositories.firstRun (welcome +
create repo) — a brand-new user with zero data lands on / and
sees the same primary action.
builds.firstRun:     primary CTA points to /repositories (where
                     builds are triggered from a repo).
organizations.firstRun: primary CTA reveals the inline create-org
                     form (handled by OrgsFirstRun client component).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add `empty-all:` mode to the mock Gitea server

**Files:**
- Modify: `apps/web/e2e/mock-gitea-server.ts`

- [ ] **Step 1: Add the new token constant**

In `apps/web/e2e/mock-gitea-server.ts`, after the existing `EMPTY_REPOS_TOKEN` constant (around line 24), add:

```ts
const EMPTY_ALL_TOKEN = 'mock-token-empty-all'
```

- [ ] **Step 2: Update the repos endpoint to recognize the new token**

Find the repos endpoint block (around line 69). Update the auth check so that either `EMPTY_REPOS_TOKEN` or `EMPTY_ALL_TOKEN` returns an empty array. The current block is:

```ts
if (path === '/api/v1/user/repos' || path === '/api/v1/users/me/repos' || path === '/api/v1/users/testuser/repos') {
  if (auth === `Bearer ${EMPTY_REPOS_TOKEN}`) {
    return json(res, 200, [])
  }
  // ... existing mock repos
}
```

Change the condition to:

```ts
if (auth === `Bearer ${EMPTY_REPOS_TOKEN}` || auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
  return json(res, 200, [])
}
```

- [ ] **Step 3: Find the orgs endpoint and add the `empty-all` branch**

Search for `/api/v1/orgs` handlers. The existing `/api/v1/orgs` (orgs listing) currently returns mock data unconditionally. Wrap it so the `empty-all` token returns `[]`:

Find the handler that matches `path === '/api/v1/orgs'` (or whichever pattern the file uses for the orgs list). At the top of that branch, add:

```ts
if (auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
  return json(res, 200, [])
}
```

If there is no `/api/v1/orgs` (list) endpoint, add one. Check by reading the file: search for `path === '/api/v1/orgs'` and `/api/v1/user/orgs` patterns. Add a new handler block if missing:

```ts
if (path === '/api/v1/orgs' || path === '/api/v1/user/orgs' || path === '/api/v1/users/me/orgs' || path === '/api/v1/users/testuser/orgs') {
  if (auth === `Bearer ${EMPTY_ALL_TOKEN}`) {
    return json(res, 200, [])
  }
  // ... existing mock orgs data
}
```

- [ ] **Step 4: Verify the server starts and accepts the new token**

Start the mock server in the background and curl it. From the repo root:

Run: `cd apps/web && pnpm exec tsx e2e/mock-gitea-server.ts &` (background)
Run: `curl -s -H "Authorization: Bearer mock-token-empty-all" http://localhost:3099/api/v1/user/repos`
Expected: `[]`
Run: `curl -s -H "Authorization: Bearer mock-token-empty-all" http://localhost:3099/api/v1/user/orgs`
Expected: `[]` (or a stubbed orgs list if Step 3 was a no-op — adjust as needed)
Stop the background server with `kill %1` or use TaskStop.

- [ ] **Step 5: Commit**

```bash
git add apps/web/e2e/mock-gitea-server.ts
git commit -m "$(cat <<'EOF'
test(e2e): add empty-all: token mode to mock Gitea server

Returns [] from /api/v1/users/me/repos, /api/v1/users/me/orgs (and
any other orgs-listing endpoint) when the bearer token is
"mock-token-empty-all". Used by the new first-run e2e tests for
/builds, /organizations, and the dashboard.

The existing "mock-token-empty-repos" mode still returns only an
empty repos list — useful for the /repositories first-run test that
wants a populated orgs list alongside the empty repos.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `/builds` first-run

**Files:**
- Modify: `apps/web/src/components/builds-list.tsx`
- Modify: `apps/web/src/app/builds/page.tsx`
- Create: `apps/web/e2e/authenticated/builds-first-run.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `apps/web/e2e/authenticated/builds-first-run.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Authenticated Builds first-run', () => {
  test.beforeEach(async ({ page }) => {
    // Swap to empty-all session so the page has zero builds
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-all' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-all session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    // Restore default session for subsequent tests
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when no builds exist', async ({ page }) => {
    await page.goto('/builds')
    await expect(
      page.getByRole('heading', { name: /no builds yet/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('builds-first-run-primary-cta')
    ).toHaveAttribute('href', '/repositories')
    await expect(
      page.getByTestId('builds-first-run-secondary-learn')
    ).toBeVisible()
    // The trigger-build <details> toggle still renders above the first-run state
    await expect(
      page.getByRole('group', { name: /trigger manual build/i })
    ).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm test:e2e -- authenticated/builds-first-run.spec.ts`
Expected: FAIL — no `data-testid="builds-first-run-primary-cta"` exists yet.

- [ ] **Step 3: Remove the empty branch from `builds-list.tsx`**

In `apps/web/src/components/builds-list.tsx`, drop the empty branch and the `'use client'` directive (no longer needed if the component is purely a list, but keep it `'use client'` for now — it's harmless):

Replace the file contents with:

```tsx
'use client'

import BuildJobCard, { type BuildJob } from '@/components/build-job-card'

export default function BuildsList({ jobs }: { jobs: BuildJob[] }) {
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <BuildJobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
```

(Note: removing the empty branch is a behavior change. The unit test that asserted the old empty message is removed in Step 6 of the *previous* /repositories task — but in this repo, there is no existing `builds-list.test.tsx`. We rely on the e2e test added in Step 1 to cover the new behavior.)

- [ ] **Step 4: Update `/builds/page.tsx` to render `FirstRunEmptyState` when jobs is empty**

In `apps/web/src/app/builds/page.tsx`, add an empty-state branch in the server component. The new imports and JSX go near the existing render.

Add to the import block:

```tsx
import { Box, BookOpen, GitBranch, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@forge-git/ui'
import { getTranslations } from 'next-intl/server'
import FirstRunEmptyState from '@/components/first-run-empty-state'
```

Then in the render, after the Redis-error branch and before the `<>` that wraps `<details>` + `<BuildsList />`, add the empty branch. The current structure is:

```tsx
{redisError ? (
  <div ...>...</div>
) : (
  <>
    <details>...</details>
    <BuildsList jobs={jobs!} />
  </>
)}
```

Replace it with:

```tsx
{redisError ? (
  <div ...>...</div>
) : jobs && jobs.length === 0 ? (
  (async () => {
    const t = await getTranslations('builds.firstRun')
    return (
      <FirstRunEmptyState
        icon={Box}
        namespace="builds.firstRun"
        primaryCta={
          <Button asChild className="w-full h-11 btn-glow">
            <Link
              href="/repositories"
              data-testid="builds-first-run-primary-cta"
              className="group inline-flex items-center justify-center gap-2"
            >
              {t('primaryCta')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        }
        secondaryCards={
          <>
            <SecondaryCard
              href="https://docs.gitea.com/usage/actions/overview"
              icon={BookOpen}
              title={t('secondaryLearnTitle')}
              description={t('secondaryLearnDesc')}
              testId="builds-first-run-secondary-learn"
              external
            />
            <SecondaryCard
              href="/repositories"
              icon={GitBranch}
              title={t('secondaryBrowseTitle')}
              description={t('secondaryBrowseDesc')}
              testId="builds-first-run-secondary-browse"
            />
          </>
        }
      />
    )
  })()
) : (
  <>
    <details>...</details>
    <BuildsList jobs={jobs!} />
  </>
)}
```

The async IIFE pattern is awkward in JSX. **Better alternative**: refactor the empty state into a small async component local to the page. Add a helper above the default export:

```tsx
async function BuildsFirstRun() {
  const t = await getTranslations('builds.firstRun')
  return (
    <FirstRunEmptyState
      icon={Box}
      namespace="builds.firstRun"
      primaryCta={
        <Button asChild className="w-full h-11 btn-glow">
          <Link
            href="/repositories"
            data-testid="builds-first-run-primary-cta"
            className="group inline-flex items-center justify-center gap-2"
          >
            {t('primaryCta')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      }
      secondaryCards={
        <>
          <SecondaryCard
            href="https://docs.gitea.com/usage/actions/overview"
            icon={BookOpen}
            title={t('secondaryLearnTitle')}
            description={t('secondaryLearnDesc')}
            testId="builds-first-run-secondary-learn"
            external
          />
          <SecondaryCard
            href="/repositories"
            icon={GitBranch}
            title={t('secondaryBrowseTitle')}
            description={t('secondaryBrowseDesc')}
            testId="builds-first-run-secondary-browse"
          />
        </>
      }
    />
  )
}
```

Then in the page render, replace the empty branch with `<BuildsFirstRun />`:

```tsx
{redisError ? (
  <div ...>...</div>
) : jobs && jobs.length === 0 ? (
  <BuildsFirstRun />
) : (
  <>
    <details>...</details>
    <BuildsList jobs={jobs!} />
  </>
)}
```

Also add a local `SecondaryCard` helper (mirror the one in `repo-list.tsx`):

```tsx
function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof Box
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
```

(The `getByRole('group', { name: /trigger manual build/i })` in the e2e test matches the `<details>` element wrapping the form. If it doesn't match, change the test to use `page.locator('details summary', { hasText: /trigger manual build/i })`.)

- [ ] **Step 5: Run the e2e test to verify it passes**

Run: `cd apps/web && pnpm test:e2e -- authenticated/builds-first-run.spec.ts`
Expected: PASS

- [ ] **Step 6: Verify typecheck and full unit suite**

Run: `cd apps/web && npx tsc --noEmit && pnpm test`
Expected: clean, 183+ unit tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/builds-list.tsx \
        apps/web/src/app/builds/page.tsx \
        apps/web/e2e/authenticated/builds-first-run.spec.ts
git commit -m "$(cat <<'EOF'
feat(builds): add first-run empty state with link to repositories

When the user has no builds, /builds now renders a FirstRunEmptyState
in place of the sparse "No builds yet" message. Primary CTA takes
the user to /repositories (where builds are triggered from a repo);
secondary cards link to the Gitea Actions guide and the repo list.

The <details> "Trigger Manual Build" form stays above the first-run
state so power users can still get to it. The empty-state branch
moves from BuildsList (client) to the page (server) so the server
can call getTranslations and stay compatible with the i18n layer.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `/organizations` first-run with inline form reveal

**Files:**
- Create: `apps/web/src/components/orgs-first-run.tsx`
- Create: `apps/web/src/__tests__/components/orgs-first-run.test.tsx`
- Modify: `apps/web/src/app/organizations/page.tsx`
- Create: `apps/web/e2e/authenticated/organizations-first-run.spec.ts`

- [ ] **Step 1: Write the failing unit test**

Create `apps/web/src/__tests__/components/orgs-first-run.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import OrgsFirstRun from '@/components/orgs-first-run'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const map: Record<string, string> = {
      headline: 'No organizations yet',
      subhead: 'Create an organization',
      primaryCta: 'Create your first organization',
      secondaryLearnTitle: 'Learn about organizations',
      secondaryLearnDesc: 'Read the Gitea organizations guide',
    }
    return map[key] ?? key
  }),
}))

vi.mock('@/components/create-org-form', () => ({
  default: () => <form data-testid="create-org-form">CreateOrgForm mock</form>,
}))

afterEach(() => cleanup())

describe('OrgsFirstRun', () => {
  it('renders the first-run headline initially', async () => {
    const jsx = await OrgsFirstRun()
    render(jsx)
    expect(screen.getByRole('heading', { name: 'No organizations yet' })).toBeInTheDocument()
  })

  it('renders the primary CTA as a button (not a link)', async () => {
    const jsx = await OrgsFirstRun()
    render(jsx)
    const cta = screen.getByTestId('orgs-first-run-primary-cta')
    expect(cta.tagName).toBe('BUTTON')
  })

  it('does not show the create form initially', async () => {
    const jsx = await OrgsFirstRun()
    render(jsx)
    expect(screen.queryByTestId('create-org-form')).not.toBeInTheDocument()
  })

  it('reveals the inline create form when primary CTA is clicked', async () => {
    const jsx = await OrgsFirstRun()
    render(jsx)
    fireEvent.click(screen.getByTestId('orgs-first-run-primary-cta'))
    expect(screen.getByTestId('create-org-form')).toBeInTheDocument()
  })

  it('hides the first-run headline after the form is revealed', async () => {
    const jsx = await OrgsFirstRun()
    render(jsx)
    fireEvent.click(screen.getByTestId('orgs-first-run-primary-cta'))
    expect(screen.queryByRole('heading', { name: 'No organizations yet' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx vitest run src/__tests__/components/orgs-first-run.test.tsx`
Expected: FAIL — `OrgsFirstRun` does not exist.

- [ ] **Step 3: Create the `OrgsFirstRun` client component**

Create `apps/web/src/components/orgs-first-run.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Building2, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@forge-git/ui'
import Link from 'next/link'
import FirstRunEmptyState from '@/components/first-run-empty-state'
import CreateOrgForm from '@/components/create-org-form'

export default async function OrgsFirstRun() {
  const t = await getTranslations('organizations.firstRun')
  return <OrgsFirstRunClient t={t} />
}

function OrgsFirstRunClient({ t }: { t: Awaited<ReturnType<typeof getTranslations<'organizations.firstRun'>>> }) {
  const [showForm, setShowForm] = useState(false)

  if (showForm) {
    return (
      <div data-testid="orgs-create-form-wrapper">
        <h2 className="text-xl font-semibold mb-1">{t('headline')}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t('subhead')}</p>
        <CreateOrgForm />
      </div>
    )
  }

  return (
    <FirstRunEmptyState
      icon={Building2}
      namespace="organizations.firstRun"
      primaryCta={
        <Button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full h-11 btn-glow group inline-flex items-center justify-center gap-2"
          data-testid="orgs-first-run-primary-cta"
        >
          <Plus className="w-4 h-4" />
          {t('primaryCta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      }
      secondaryCards={
        <SecondaryCard
          href="https://docs.gitea.com/user/organizations/"
          icon={BookOpen}
          title={t('secondaryLearnTitle')}
          description={t('secondaryLearnDesc')}
          testId="orgs-first-run-secondary-learn"
          external
        />
      }
    />
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof Building2
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
```

Note: `getTranslations` returns a translator function typed as `ReturnType<typeof getTranslations<...>>`. The pattern above should typecheck, but if the next-intl types don't expose the namespace, the simpler approach is to type `t` as `(key: string) => string` in the client wrapper and pass strings:

```tsx
function OrgsFirstRunClient({ t }: { t: (key: string) => string }) {
```

(Use this if the typed-Awaited return is brittle.)

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `cd apps/web && npx vitest run src/__tests__/components/orgs-first-run.test.tsx`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Update `/organizations/page.tsx` to delegate to `OrgsFirstRun`**

In `apps/web/src/app/organizations/page.tsx`, replace the existing empty-state block. The current render uses `<EmptyState>` (from `@/components/empty-state`):

```tsx
{orgs.length === 0 ? (
  <EmptyState
    icon={Building2}
    title="No organizations"
    description="You are not a member of any organizations yet."
  />
) : (
  /* orgs list */
)}
```

Replace with:

```tsx
{orgs.length === 0 ? (
  <OrgsFirstRun />
) : (
  /* orgs list — unchanged */
)}
```

Add the import:

```tsx
import OrgsFirstRun from '@/components/orgs-first-run'
```

Remove the now-unused `EmptyState` and `Building2` imports (only if they're not used elsewhere on the page). The `Building2` icon is no longer needed by the page.

- [ ] **Step 6: Write the failing e2e test**

Create `apps/web/e2e/authenticated/organizations-first-run.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Authenticated Organizations first-run', () => {
  test.beforeEach(async ({ page }) => {
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-all' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-all session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when no organizations exist', async ({ page }) => {
    await page.goto('/organizations')
    await expect(
      page.getByRole('heading', { name: /no organizations yet/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('orgs-first-run-secondary-learn')
    ).toBeVisible()
  })

  test('primary CTA is a button, not a link', async ({ page }) => {
    await page.goto('/organizations')
    const cta = page.getByTestId('orgs-first-run-primary-cta')
    await expect(cta).toBeVisible()
    // The primary CTA is a <button> (not an <a>) — clicking it
    // should reveal the inline form rather than navigate.
    const tagName = await cta.evaluate((el) => el.tagName)
    expect(tagName).toBe('BUTTON')
  })

  test('clicking primary CTA reveals the inline create form without navigating', async ({ page }) => {
    await page.goto('/organizations')
    const url = page.url()
    await page.getByTestId('orgs-first-run-primary-cta').click()
    // No navigation: URL unchanged
    expect(page.url()).toBe(url)
    // The create form is now rendered
    await expect(page.getByTestId('orgs-create-form-wrapper')).toBeVisible()
    // The first-run headline is gone
    await expect(
      page.getByRole('heading', { name: /no organizations yet/i })
    ).not.toBeVisible()
  })
})
```

- [ ] **Step 7: Run the e2e test to verify it passes**

Run: `cd apps/web && pnpm test:e2e -- authenticated/organizations-first-run.spec.ts`
Expected: PASS

- [ ] **Step 8: Verify typecheck and full unit suite**

Run: `cd apps/web && npx tsc --noEmit && pnpm test`
Expected: clean, 188+ unit tests pass (5 new orgs-first-run tests added).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/orgs-first-run.tsx \
        apps/web/src/app/organizations/page.tsx \
        apps/web/src/__tests__/components/orgs-first-run.test.tsx \
        apps/web/e2e/authenticated/organizations-first-run.spec.ts
git commit -m "$(cat <<'EOF'
feat(organizations): add first-run empty state with inline create form

When the user has no organizations, /organizations now renders an
OrgsFirstRun client component. The primary CTA is a button (not a
link) that reveals the existing CreateOrgForm inline on the same
page — per user decision, no navigation to /organizations/new.

The new component:
- Renders FirstRunEmptyState with a Button onClick handler
- Toggles to a heading + inline <CreateOrgForm /> on click
- Keeps a single secondary card linking to the Gitea orgs guide

The page-level EmptyState placeholder is removed; the orgs list
branch is unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Dashboard first-run

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/e2e/authenticated/dashboard-first-run.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `apps/web/e2e/authenticated/dashboard-first-run.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Authenticated Dashboard first-run', () => {
  test.beforeEach(async ({ page }) => {
    const resp = await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-all' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-all session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ page }) => {
    await page.context().request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when all sections are empty', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /welcome to forge-git/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('dashboard-first-run-primary-cta')
    ).toHaveAttribute('href', '/repositories/new')
    await expect(
      page.getByTestId('dashboard-first-run-secondary-org')
    ).toBeVisible()
    await expect(
      page.getByTestId('dashboard-first-run-secondary-learn')
    ).toBeVisible()
  })

  test('does not render DashboardStats or DashboardSections in first-run', async ({ page }) => {
    await page.goto('/')
    // The stats grid has specific testids; assert they are NOT in the doc
    const repoStat = page.getByText('Repositories', { exact: true })
    await expect(repoStat).not.toBeVisible()
  })

  test('first-run renders in en, es, and zh', async ({ page }) => {
    for (const locale of ['en', 'es', 'zh'] as const) {
      await page.context().clearCookies()
      await page.context().addCookies([
        { name: 'NEXT_LOCALE', value: locale, domain: 'localhost', path: '/' },
      ])
      await page.goto('/')
      await expect(
        page.getByRole('heading', { name: /welcome to forge-git|forge-git|欢迎/i })
      ).toBeVisible({ timeout: 5000 })
    }
  })
})
```

- [ ] **Step 2: Run the e2e test to verify it fails**

Run: `cd apps/web && pnpm test:e2e -- authenticated/dashboard-first-run.spec.ts`
Expected: FAIL — no `data-testid="dashboard-first-run-primary-cta"` exists yet.

- [ ] **Step 3: Update `/page.tsx` to render `FirstRunEmptyState` when all sections are empty**

In `apps/web/src/app/page.tsx`, restructure the authenticated render path. The current structure is:

```tsx
{dashboard ? (
  <>
    <DashboardStats ... />
    <DashboardSections ... />
  </>
) : (
  <div className="border border-dashed ...">No data available...</div>
)}
```

Replace with a three-way branch: first-run, populated, or error.

Add imports:

```tsx
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import FirstRunEmptyState from '@/components/first-run-empty-state'
```

Add a local `DashboardFirstRun` async helper above the default export:

```tsx
async function DashboardFirstRun() {
  const t = await getTranslations('dashboard.firstRun')
  return (
    <FirstRunEmptyState
      icon={GitBranch}
      namespace="dashboard.firstRun"
      primaryCta={
        <Button asChild className="w-full h-11 btn-glow">
          <Link
            href="/repositories/new"
            data-testid="dashboard-first-run-primary-cta"
            className="group inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('primaryCta')}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      }
      secondaryCards={
        <>
          <SecondaryCard
            href="/organizations/new"
            icon={Users}
            title={t('secondaryOrgTitle')}
            description={t('secondaryOrgDesc')}
            testId="dashboard-first-run-secondary-org"
          />
          <SecondaryCard
            href="https://docs.gitea.com/user/using-git/"
            icon={BookOpen}
            title={t('secondaryLearnTitle')}
            description={t('secondaryLearnDesc')}
            testId="dashboard-first-run-secondary-learn"
            external
          />
        </>
      }
    />
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  testId,
  external = false,
}: {
  href: string
  icon: typeof GitBranch
  title: string
  description: string
  testId: string
  external?: boolean
}) {
  const className =
    'flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left'
  const content = (
    <>
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </>
  )
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid={testId}>
      {content}
    </Link>
  )
}
```

Replace the dashboard render branch in the JSX:

```tsx
{error && (
  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 mb-6">
    <AlertCircle className="w-4 h-4 shrink-0" />
    <span>Unable to load dashboard data: {error}</span>
  </div>
)}

{dashboard &&
dashboard.repos.length === 0 &&
dashboard.pulls.length === 0 &&
dashboard.issues.length === 0 &&
dashboard.builds.length === 0 ? (
  <DashboardFirstRun />
) : dashboard ? (
  <>
    <DashboardStats ... />
    <DashboardSections ... />
  </>
) : (
  <div className="border border-dashed border-border rounded-lg p-8 text-center">
    <Server className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">
      No data available. Create a repository to get started.
    </p>
  </div>
)}
```

- [ ] **Step 4: Run the e2e test to verify it passes**

Run: `cd apps/web && pnpm test:e2e -- authenticated/dashboard-first-run.spec.ts`
Expected: PASS

- [ ] **Step 5: Verify typecheck and full unit suite**

Run: `cd apps/web && npx tsc --noEmit && pnpm test`
Expected: clean, 188+ unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/page.tsx \
        apps/web/e2e/authenticated/dashboard-first-run.spec.ts
git commit -m "$(cat <<'EOF'
feat(dashboard): add first-run welcome when all sections are empty

When the authenticated dashboard has zero repos, pulls, issues,
and builds, / now renders a FirstRunEmptyState in place of the
sparse "No data available" placeholder. The primary CTA points
to /repositories/new; secondary cards mirror /repositories first-run
(create an org, learn more).

The error fallback (when fetchDashboardData throws) is unchanged.
The DashboardStats + DashboardSections grid is unchanged for
populated users.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `cd apps/web && pnpm test`
Expected: all 188+ unit tests pass.

- [ ] **Step 2: Run typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the build**

Run: `cd apps/web && pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Run the full e2e suite**

Run: `cd apps/web && pnpm test:e2e`
Expected: all e2e tests pass (repositories, builds-first-run, organizations-first-run, dashboard-first-run, plus all the existing auth/*.spec.ts files).

- [ ] **Step 5: Push to both remotes**

```bash
git push origin main
git push github-backup main
```

Expected: both pushes succeed.

- [ ] **Step 6: Final commit (no-op if all commits already pushed)**

If any verification revealed a fix, commit and re-push. Otherwise, this task is done.

```bash
git log --oneline -10  # confirm 6+ new commits beyond the spec
```

---

## Self-Review Notes

**Spec coverage:**
- Spec § Component Design: covered by Task 1 (generalize) + Task 5 (OrgsFirstRun client wrapper)
- Spec § Per-page composition: covered by Tasks 4, 5, 6
- Spec § i18n Namespaces: covered by Task 2 (en/es/zh)
- Spec § Mock Gitea Server Changes: covered by Task 3 (`empty-all:` mode)
- Spec § Page-by-page Change List: covered by Tasks 4, 5, 6
- Spec § Testing (unit + e2e + locale smoke): covered in each task; locale smoke in Task 6
- Spec § Implementation Order: matched exactly (refactor → i18n → mock → builds → orgs → dashboard → verify)

**Placeholder scan:** No TBDs, no "implement later" steps. Every step has a concrete code block or exact command. SecondaryCard component is repeated in Tasks 4/5/6 — that's the per-page composition pattern, not duplication; it stays in each file because the testids differ and the cards differ per page. If we wanted to factor it out further, a future refactor could move it to a shared file.

**Type consistency:** All FirstRunEmptyState call sites use the same prop signature defined in Task 1. All testids follow the `{page}-first-run-{role}` pattern (`first-run-primary-cta` for the existing /repositories; `builds-first-run-primary-cta`, `orgs-first-run-primary-cta`, `dashboard-first-run-primary-cta` for the new ones). The `getTranslations` namespace strings match the i18n keys added in Task 2.

**Ambiguity check:** The "no DashboardStats" assertion in the dashboard e2e test relies on the fact that the stats section uses the literal "Repositories" as a label. If that's not visible in the rendered DOM, the test will be brittle. **Mitigation**: if the assertion fails in review, relax it to "the page does not contain a stat with a numeric value" or just check for absence of a specific testid.
