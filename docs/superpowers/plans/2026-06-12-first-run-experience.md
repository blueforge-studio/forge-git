# First-Run Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic empty state on `/repositories` with a purpose-built first-run welcome that surfaces one primary CTA ("Create your first repository") plus two small secondary cards ("Create an organization", "Learn more"). Any user with zero repos sees it; rendering is stateless.

**Architecture:** New server component `FirstRunEmptyState` (`apps/web/src/components/first-run-empty-state.tsx`). `repo-list.tsx` swaps its current `EmptyState` branch for `<FirstRunEmptyState />` and removes the now-unused `EmptyState` and `Server` imports. New top-level `repositories` i18n namespace with 7 keys under `repositories.firstRun.*`, added to all 3 locale files (en/es/zh with English placeholders for es/zh). 3 new e2e tests in the authenticated repositories spec + 1 locale smoke test in auth.spec. Tests use a sentinel session token (`mock-token-empty-repos`) that the mock Gitea server recognizes and responds to with an empty array — needed because `/repositories` is a server component whose Gitea call is server-side and cannot be intercepted with `page.route()`.

**Tech Stack:** Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript, Tailwind 4, next-intl v4.13.0 (en/es/zh), Playwright 1.60.0 (e2e), Lucide icons. No new dependencies.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `apps/web/src/components/first-run-empty-state.tsx` | NEW | Server component. GitBranch icon + headline + subhead + primary CTA + 2 secondary cards. |
| `apps/web/src/components/repo-list.tsx` | MODIFY | Swap `<EmptyState />` branch for `<FirstRunEmptyState />`. Remove unused imports. |
| `apps/web/messages/en.json` | MODIFY | Add `repositories.firstRun.*` namespace (7 keys). |
| `apps/web/messages/es.json` | MODIFY | Same (English placeholders). |
| `apps/web/messages/zh.json` | MODIFY | Same (English placeholders). |
| `apps/web/e2e/mock-gitea-server.ts` | MODIFY | Recognize `mock-token-empty-repos` token and return `[]` for `/api/v1/user/repos`. |
| `apps/web/e2e/authenticated/repositories.spec.ts` | MODIFY | Add 3 new tests for the first-run state. |
| `apps/web/e2e/auth.spec.ts` | MODIFY | Add 1 locale smoke test. |

---

## Task 1: Add `repositories.firstRun.*` i18n namespace

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/es.json`
- Modify: `apps/web/messages/zh.json`

- [ ] **Step 1: Add namespace to en.json**

Open `apps/web/messages/en.json`. The file currently ends with the `auth` namespace closing brace. Add a comma after that brace and append the new top-level `repositories` namespace. The new content to append (preserving the existing closing brace structure):

The last 12 lines of en.json currently look like:

```
    "callback": {
      "brandTagline": "Welcome back",
      "signingInHeadline": "Signing you in…",
      "signingInSubhead": "Finishing your Gitea session",
      "errorHeadline": "We couldn't sign you in",
      "errorSubhead": "Something went wrong completing your Gitea session.",
      "tryAgain": "Try again"
    }
  }
}
```

Replace those last 3 lines (`    }\n  }\n}`) with:

```
    }
  },
  "repositories": {
    "firstRun": {
      "headline": "Welcome to forge-git",
      "subhead": "Create your first repository to get started",
      "primaryCta": "Create your first repository",
      "secondaryOrgTitle": "Create an organization",
      "secondaryOrgDesc": "Host repos for a team or project",
      "secondaryLearnTitle": "Learn more",
      "secondaryLearnDesc": "Browse the Gitea user guide"
    }
  }
}
```

- [ ] **Step 2: Add namespace to es.json (English placeholders)**

Open `apps/web/messages/es.json`. The `auth` namespace is the last top-level key. Apply the same change as in Step 1 — replace the final `    }\n  }\n}` with the new structure (the `repositories.firstRun` block with English placeholder values, identical to en.json).

- [ ] **Step 3: Add namespace to zh.json (English placeholders)**

Open `apps/web/messages/zh.json`. Same operation as es.json — add the same `repositories` block with English placeholder values, structured as in Step 1.

- [ ] **Step 4: Validate JSON files parse cleanly**

Run: `cd apps/web && for f in messages/en.json messages/es.json messages/zh.json; do node -e "JSON.parse(require('fs').readFileSync('$f', 'utf8'))" && echo "$f OK" || echo "$f FAILED"; done`

Expected: All 3 files print `OK`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/es.json apps/web/messages/zh.json
git commit -m "feat(i18n): add repositories.firstRun namespace"
```

---

## Task 2: Implement `FirstRunEmptyState` and swap it into `repo-list.tsx`

**Files:**
- Create: `apps/web/src/components/first-run-empty-state.tsx`
- Modify: `apps/web/src/components/repo-list.tsx`

- [ ] **Step 1: Create the FirstRunEmptyState component**

Create `apps/web/src/components/first-run-empty-state.tsx` with the following exact content:

```tsx
import Link from 'next/link'
import { GitBranch, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@forge-git/ui'
import { getTranslations } from 'next-intl/server'

export async function FirstRunEmptyState() {
  const t = await getTranslations('repositories.firstRun')

  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <GitBranch
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold mb-1">{t('headline')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('subhead')}</p>

      <Button asChild className="w-full h-11 btn-glow">
        <Link
          href="/repositories/new"
          className="group inline-flex items-center justify-center gap-2"
          data-testid="first-run-primary-cta"
        >
          <Plus className="w-4 h-4" />
          {t('primaryCta')}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <SecondaryCard
          href="/organizations/new"
          icon={Users}
          title={t('secondaryOrgTitle')}
          description={t('secondaryOrgDesc')}
        />
        <SecondaryCard
          href="https://docs.gitea.com/user/using-git/"
          icon={BookOpen}
          title={t('secondaryLearnTitle')}
          description={t('secondaryLearnDesc')}
          external
        />
      </div>
    </div>
  )
}

function SecondaryCard({
  href,
  icon: Icon,
  title,
  description,
  external = false,
}: {
  href: string
  icon: typeof Users
  title: string
  description: string
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-testid="first-run-secondary-learn"
      >
        {content}
      </a>
    )
  }
  return (
    <Link href={href} className={className} data-testid="first-run-secondary-org">
      {content}
    </Link>
  )
}
```

Notes:
- This is an **async server component** because `getTranslations` from `next-intl/server` is async. The `async` keyword on the function is required.
- The `external` boolean toggles between `<Link>` (internal) and `<a target="_blank">` (external). The external link uses `rel="noopener noreferrer"` for full safety (a stronger choice than the spec's "noopener").
- The `data-testid` attributes are used by the e2e tests in Task 4.
- The `group` class on the primary CTA `<Link>` enables the `group-hover:translate-x-0.5` arrow nudge (matches the pattern in `apps/web/src/app/login/page.tsx` line 121).
- The `SecondaryCard` subcomponent is local to this file because it's used twice in the same place. Promote to its own file if a third caller ever appears (consistent with the `AuthShell` subcomponent pattern).

- [ ] **Step 2: Update `repo-list.tsx` to use FirstRunEmptyState**

Open `apps/web/src/components/repo-list.tsx`. Make the following edits:

Replace the imports block (lines 1-5):
```tsx
import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import RepoCard from './repo-card'
import EmptyState from './empty-state'
import { Server } from 'lucide-react'
```

With:
```tsx
import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import RepoCard from './repo-card'
import { FirstRunEmptyState } from './first-run-empty-state'
```

Replace the empty-state branch (lines 23-33):
```tsx
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
```

With:
```tsx
  if (repos.length === 0) {
    return <FirstRunEmptyState />
  }
```

Verify the rest of the file is unchanged. The function should now look like:

```tsx
import { listUserRepos } from '@forge-git/gitea-bridge'
import type { Session } from '@/lib/session'
import RepoCard from './repo-card'
import { FirstRunEmptyState } from './first-run-empty-state'

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
    return <FirstRunEmptyState />
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

- [ ] **Step 3: Run type check**

Run: `cd apps/web && pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 4: Run unit tests**

Run: `cd apps/web && pnpm test`
Expected: 183/183 pass (no test changes yet, but we want to make sure no other code path broke).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/first-run-empty-state.tsx apps/web/src/components/repo-list.tsx
git commit -m "feat(repositories): add first-run empty state with create CTA"
```

---

## Task 3: Add a token-based "empty repos" mode to the mock Gitea server

**Files:**
- Modify: `apps/web/e2e/mock-gitea-server.ts`

The `/repositories` page is a **server component** — `listUserRepos('me', ...)` is called on the Node.js server, not in the browser. Playwright's `page.route()` only intercepts browser-side fetches, so we cannot use it to override the Gitea response for this test. Instead, we add a token-based "empty" mode to the mock Gitea server: when the request's `Authorization` header is a specific sentinel token, the mock returns `[]` for `/api/v1/user/repos`. The test session endpoint already accepts a `token` parameter, so the test can swap the session to use this token before navigating.

- [ ] **Step 1: Add the empty-repos token check to the mock server**

Open `apps/web/e2e/mock-gitea-server.ts`. We add a constant near the top of the file (after the `parseUrl` function around line 21, before the `server` variable on line 23):

```ts
// Special tokens that change mock server behavior for specific test scenarios
const EMPTY_REPOS_TOKEN = 'mock-token-empty-repos'
```

Then modify the `/api/v1/user/repos` and `/api/v1/users/testuser/repos` handler (lines 66-98). The current code is:

```ts
  if (path === '/api/v1/user/repos' || path === '/api/v1/users/testuser/repos') {
    return json(res, 200, [
      // ... 3 hardcoded repos ...
    ])
  }
```

Replace the `if` line and add a token check. The new code (only the `if` line changes; the rest of the block stays the same):

```ts
  if (path === '/api/v1/user/repos' || path === '/api/v1/users/testuser/repos') {
    if (auth === `Bearer ${EMPTY_REPOS_TOKEN}`) {
      return json(res, 200, [])
    }
    return json(res, 200, [
      {
        id: 1, name: 'frontend', full_name: 'testuser/frontend', private: false,
        description: 'React frontend application', empty: false, fork: false, mirror: false,
        size: 1234, stars_count: 12, forks_count: 3, default_branch: 'main', archived: false,
        created_at: '2024-06-15T00:00:00Z', updated_at: '2025-06-01T10:00:00Z',
        permissions: { admin: true, push: true, pull: true },
        owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        html_url: 'http://localhost:3099/testuser/frontend',
      },
      {
        id: 2, name: 'backend', full_name: 'testuser/backend', private: true,
        description: 'Go API server', empty: false, fork: false, mirror: false,
        size: 890, stars_count: 5, forks_count: 1, default_branch: 'main', archived: false,
        created_at: '2024-08-01T00:00:00Z', updated_at: '2025-06-05T14:00:00Z',
        permissions: { admin: true, push: true, pull: true },
        owner: { id: 1, login: 'testuser', full_name: 'Test User', avatar_url: '' },
        html_url: 'http://localhost:3099/testuser/backend',
        language: 'Go',
      },
      {
        id: 3, name: 'shared-lib', full_name: 'testorg/shared-lib', private: false,
        description: 'Shared utility library', empty: false, fork: false, mirror: false,
        size: 345, stars_count: 20, forks_count: 7, default_branch: 'main', archived: false,
        created_at: '2024-09-01T00:00:00Z', updated_at: '2025-06-08T08:00:00Z',
        permissions: { admin: false, push: true, pull: true },
        owner: { id: 2, login: 'testorg', full_name: 'Test Org', avatar_url: '' },
        html_url: 'http://localhost:3099/testorg/shared-lib',
        language: 'Rust',
      },
    ])
  }
```

The 3-repo payload is preserved verbatim. The `auth` variable is already extracted at line 35 (`const auth = req.headers.authorization`).

- [ ] **Step 2: Manually verify the mock server responds correctly to both tokens**

```bash
# Stop any running mock server, then start it fresh
cd apps/web && npx tsx e2e/mock-gitea-server.ts &
sleep 1
# Default token: expect 3 repos
curl -s -H "Authorization: Bearer mock-token" http://localhost:3099/api/v1/user/repos | head -c 200
echo ""
# Sentinel token: expect empty array
curl -s -H "Authorization: Bearer mock-token-empty-repos" http://localhost:3099/api/v1/user/repos
echo ""
kill %1
```

Expected output: the first call returns `[{"id":1,...}]` and the second returns `[]`.

- [ ] **Step 3: Run all existing e2e tests to confirm no regressions**

Run: `cd apps/web && npx playwright test`
Expected: all tests pass (the default token behavior is unchanged; the new check only fires for the sentinel token).

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/mock-gitea-server.ts
git commit -m "test(e2e): add token-based empty-repos mode to mock Gitea server"
```

---

## Task 4: Add e2e tests for the first-run state

**Files:**
- Modify: `apps/web/e2e/authenticated/repositories.spec.ts`

These tests rely on the `mock-token-empty-repos` token added in Task 3. Each test re-creates the session with this token in `beforeEach` (so the Gitea call returns 0 repos), then resets it in `afterEach` (so the original 3-repo session is restored for any tests that follow).

- [ ] **Step 1: Add 3 new tests to authenticated/repositories.spec.ts**

Open `apps/web/e2e/authenticated/repositories.spec.ts`. Add the following tests at the end of the file (after the last `test.describe` block, which is `Authenticated Issues`):

```ts
test.describe('Authenticated Repositories empty state', () => {
  test.beforeEach(async ({ request }) => {
    // Swap the session token so the mock Gitea server returns zero repos
    // (see Task 3: EMPTY_REPOS_TOKEN in mock-gitea-server.ts)
    const resp = await request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-repos' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-repos session: ${JSON.stringify(body)}`)
  })

  test.afterEach(async ({ request }) => {
    // Restore the default 3-repo session for subsequent tests
    await request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token' },
    })
  })

  test('shows first-run welcome when user has zero repositories', async ({ page }) => {
    await page.goto('/repositories')
    await expect(
      page.getByRole('heading', { name: /welcome to forge-git/i })
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-primary-cta')
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-secondary-org')
    ).toBeVisible()
    await expect(
      page.getByTestId('first-run-secondary-learn')
    ).toBeVisible()
    // The top header still renders alongside the empty state
    await expect(page.getByRole('link', { name: /new repository/i })).toBeVisible()
  })

  test('primary CTA navigates to new repo page', async ({ page }) => {
    await page.goto('/repositories')
    await page.getByTestId('first-run-primary-cta').click()
    await expect(page).toHaveURL(/\/repositories\/new/)
  })

  test('learn more card opens in a new tab to Gitea docs', async ({ page }) => {
    await page.goto('/repositories')
    const learnMore = page.getByTestId('first-run-secondary-learn')
    await expect(learnMore).toHaveAttribute('target', '_blank')
    await expect(learnMore).toHaveAttribute('rel', /noopener/)
    await expect(learnMore).toHaveAttribute('href', /docs\.gitea\.com/)
  })
})
```

Notes:
- The session cookie is set by the `/api/test/session` endpoint via `createSession`, which writes an encrypted cookie. The next request from the browser automatically sends the new cookie, so the server component's `listUserRepos` call uses the new token.
- The `request` fixture is a per-test request context, but cookies are shared with the page's `context` (because the test session endpoint writes a cookie on the same domain as the page). So setting the session via `request.post('/api/test/session', ...)` updates the cookie for subsequent page navigations.
- The `afterEach` restores the default token so the test file's other describe blocks (e.g. `Authenticated Pull Requests`, `Authenticated Issues`) are unaffected when this file is run in full.
- The `rel` attribute is matched with a regex `/noopener/` because the actual value is `noopener noreferrer` (we set both for full safety).
- These tests live in the authenticated spec file because the page requires an authenticated session. The auth setup in `auth.setup.ts` runs before all tests in this folder.

- [ ] **Step 2: Run the new e2e tests to verify they pass**

Run: `cd apps/web && npx playwright test e2e/authenticated/repositories.spec.ts -g "empty state"`
Expected: 3/3 tests pass.

- [ ] **Step 3: Run the full authenticated e2e suite to confirm no regressions**

Run: `cd apps/web && npx playwright test e2e/authenticated/`
Expected: all tests pass (existing tests + 3 new ones).

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/authenticated/repositories.spec.ts
git commit -m "test(e2e): add first-run empty state tests for /repositories"
```

---

## Task 5: Add locale smoke test

**Files:**
- Modify: `apps/web/e2e/auth.spec.ts`

- [ ] **Step 1: Add the locale smoke test to auth.spec.ts**

Open `apps/web/e2e/auth.spec.ts`. Find the end of the `Unauthenticated pages` describe block (after the `callback page redirects to login on unknown state` test). Add a new `test.describe` block immediately after:

```ts
test.describe('First-run state locales', () => {
  test('first-run headline renders in all 3 locales', async ({ page, request }) => {
    // Set a session with the empty-repos token so the page renders the welcome state.
    // (auth.spec.ts runs without the auth.setup.ts session, so we create one here.)
    const resp = await request.post('/api/test/session', {
      data: { baseUrl: 'http://localhost:3099', token: 'mock-token-empty-repos' },
    })
    const body = await resp.json()
    if (!body.ok) throw new Error(`Failed to set empty-repos session: ${JSON.stringify(body)}`)

    for (const locale of ['en', 'es', 'zh']) {
      await page.goto(`/${locale}/repositories`)
      await expect(
        page.getByRole('heading', { name: /welcome to forge-git/i })
      ).toBeVisible()
    }
  })
})
```

Notes:
- This test lives in `auth.spec.ts` (not the authenticated folder) because it needs to be in the unauthenticated project to test the locale routing (the authenticated project always loads the setup session). The session is set manually via `/api/test/session` since `auth.setup.ts` doesn't run for the `chromium` project.
- The locales in the app routing are: `en`, `es`, `zh` (per `apps/web/src/i18n/routing.ts`). Confirm with `cd apps/web && grep -A 20 "export const routing" src/i18n/routing.ts` if uncertain.
- All 3 locales currently ship with English placeholders, so the test matches `/welcome to forge-git/i` in all 3. If a real translation is added later and breaks, this test will need to be updated to match the translated string OR to assert on a different stable attribute like the data-testid.

- [ ] **Step 2: Run the new test to verify it passes**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts -g "locales"`
Expected: 1/1 test passes.

- [ ] **Step 3: Run the full unauthenticated e2e suite**

Run: `cd apps/web && npx playwright test e2e/auth.spec.ts`
Expected: all tests pass (existing 20 + 1 new = 21/21).

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/auth.spec.ts
git commit -m "test(e2e): add first-run state locale smoke test"
```

---

## Task 6: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Type check the whole web app**

Run: `cd apps/web && pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 2: Run unit tests**

Run: `cd apps/web && pnpm test`
Expected: 183/183 pass.

- [ ] **Step 3: Run all e2e tests**

Run: `cd apps/web && npx playwright test`
Expected: all tests pass (existing tests + 3 new in authenticated/repositories + 1 new in auth.spec).

- [ ] **Step 4: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: build succeeds. The async server component is a valid pattern in Next.js 16.2 / React 19; this verifies there are no build-time issues.

- [ ] **Step 5: Manual smoke test (documented in PR)**

Manually verify in a browser:
1. Sign in with a session that has 0 repos (or sign in then delete all repos on a test Gitea instance).
2. Confirm the first-run welcome renders with the GitBranch icon, "Welcome to forge-git" headline, primary CTA, and 2 secondary cards.
3. Click "Create your first repository" — verify it navigates to `/repositories/new`.
4. Click "Create an organization" — verify it navigates to `/organizations/new`.
5. Click "Learn more" — verify it opens `https://docs.gitea.com/user/using-git/` in a new tab.
6. Resize the browser to 375px width — verify the 2-up card grid collapses to 1 column.
7. Sign in with a session that has 1+ repos — verify the first-run state does NOT show.
8. Tab through the empty state with keyboard — verify focus order goes: primary CTA → "Create an organization" → "Learn more".

- [ ] **Step 6: Commit (only if any verification fix-ups were needed)**

If any of the previous steps revealed a fix, commit it:
```bash
git add -A
git commit -m "fix(first-run): verification follow-ups"
```

If no fixes were needed, skip this step.

---

## What's NOT in scope (per spec)

- Welcome wizard / multi-step onboarding
- Per-user `firstRunCompleted` session flag
- Personalization with user name from session
- Animated illustrations or hero graphics
- "Import from another forge" card (not implemented)
- "Invite teammates" card (requires an org first)
- Migrating the existing hardcoded English strings in `repo-list.tsx` (error + non-empty paths)
- Visual regression testing
- Full WCAG audit
- Translation of `es.json` / `zh.json` (English placeholders only)
- Empty state for the organizations page
- A `loading.tsx` for `/repositories`
- Changes to the auth callback page redirect target
