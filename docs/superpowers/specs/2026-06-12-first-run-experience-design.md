# forge-git: First-Run Experience — Design Spec

Date: 2026-06-12
Scope: Specialized empty state on `/repositories` for users with zero
       repositories. Ship the fastest path from first login to first
       useful action.
Out of scope: welcome wizards, multi-step onboarding, personalized
              greetings, animations, repo import (not implemented),
              user invite without an org (requires org first)

---

## Overview

When a new user lands on `/repositories` for the first time, they see a
purpose-built welcome state that puts one primary action front-and-center
("Create your first repository") with two small secondary cards
("Create an organization", "Learn more"). The state replaces the current
generic "No repositories yet" message and the generic `EmptyState`
component on that one route.

The trigger is stateless: any user with zero repos sees the new state.
No session flag, no per-user persistence. The trade-off — a returning
user with all repos deleted sees the welcome again — is acceptable for
the MVP and saves the complexity of a "completed onboarding" flag.

The page header ("Repositories" + "New Repository" button) stays. The
welcome state renders below the header, in the same slot the
`RepoList` grid would otherwise occupy. The new state and the list state
are mutually exclusive — never both rendered.

## Architecture

### Data flow (unchanged from current)

```
OAuth callback → /auth/callback?status=success (spinner 600ms)
              → router.replace('/repositories')
              → /repositories/page.tsx (server component)
                  ├─ getSession() [unchanged]
                  └─ <RepoList session={session} /> [unchanged]

Inside RepoList (server component, already handles fetch + error + empty):
  try { repos = await listUserRepos('me', session) }
  catch { render error card }
  if (repos.length === 0) {
    render <FirstRunEmptyState />   ← NEW (replaces generic <EmptyState />)
  } else {
    render <RepoList grid>
  }
```

No new server fetches, no session changes, no middleware changes, no
changes to the auth callback server route or the callback page.

### Why a new component, not an `EmptyState` extension

The existing `EmptyState` component is used in 7+ places (orgs list,
search, users, notifications, deploy keys, etc.) — each with a different
context. Extending it with `secondaryAction` + `docsLink` props adds
API surface that 6 of 7 callers don't need. A specialized
`FirstRunEmptyState` component is more honest about scope and easier
to change without breaking other empty states.

### File layout

```
apps/web/src/
├── components/
│   ├── first-run-empty-state.tsx   # NEW: specialized server component
│   └── repo-list.tsx               # MODIFY: swap <EmptyState /> for <FirstRunEmptyState />
├── messages/
│   ├── en.json                     # MODIFY: add repositories.firstRun namespace
│   ├── es.json                     # MODIFY: same (English placeholders)
│   └── zh.json                     # MODIFY: same
└── e2e/
    └── repositories.spec.ts        # MODIFY: add 3 new tests + 1 locale smoke test
```

## Component design

### `FirstRunEmptyState` (new, server component)

A presentational server component. No props. ~50 lines including the
JSX and 2 child subcomponents. No client-side state.

**Visual layout:**

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                       [GitBranch icon]                     │
│                       (64×64, muted)                       │
│                                                            │
│                  Welcome to forge-git                       │
│       Create your first repository to get started          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [+]  Create your first repository             →      │  │  ← primary CTA
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │ [Users]             │  │ [Book]                      │  │  ← 2-up grid
│  │ Create an org       │  │ Learn more                  │  │
│  │ Host repos for a    │  │ Browse the Gitea user guide │  │
│  │ team or project     │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Container:** `border border-dashed border-border rounded-lg p-12 text-center`
(matches existing `EmptyState` for visual consistency across the app).

**Children (top to bottom):**
1. Icon: `GitBranch` from lucide-react, `w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50`,
   `aria-hidden="true"`
2. Headline: `<h2 className="text-xl font-semibold mb-1">` — i18n key `repositories.firstRun.headline`
3. Subhead: `<p className="text-sm text-muted-foreground mb-6">` — i18n key `repositories.firstRun.subhead`
4. Primary CTA: full-width `<Button asChild>` with `Plus` icon + `ArrowRight` icon (hover nudge),
   `h-11`, `btn-glow` class, links to `/repositories/new`. Label: `repositories.firstRun.primaryCta`
5. Secondary grid: `<div className="grid gap-3 sm:grid-cols-2 mt-4">` with 2 `SecondaryCard` subcomponents
   - Card 1: "Create an organization" → `/organizations/new` (icon: `Users`)
   - Card 2: "Learn more" → `https://docs.gitea.com/user/using-git/` (icon: `BookOpen`, external link with `target="_blank" rel="noopener"`)

**Subcomponent pattern (in same file):**

```tsx
function SecondaryCard({...}) {
  return <a className="flex items-start gap-3 p-5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left">...</a>
}
```

Local subcomponent because it's only used twice in the same file and
saves ~15 lines of repetition. Promote to its own file if a third
caller ever appears (consistent with the `AuthShell` subcomponent
pattern from the auth-helper-pages spec).

### `repo-list.tsx` (modify)

Change one branch. In the empty-state render:

**Before:**
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

**After:**
```tsx
if (repos.length === 0) {
  return <FirstRunEmptyState />
}
```

Remove the now-unused `EmptyState` and `Server` imports from this file
(check the rest of the file — neither is referenced elsewhere).

## i18n

### New `repositories` namespace (top-level key)

All 3 locale files get a new top-level `repositories` key. (None
existed before — `/repositories` currently uses hardcoded English
strings. Migrating the existing hardcoded strings is out of scope;
this spec only adds the new keys needed by the new component.)

```json
{
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

7 keys per locale. `es.json` and `zh.json` ship with the English values
as placeholders (per the established pattern from the login redesign
and auth-helper-pages specs). The existing `getMessageFallback` in
`apps/web/src/i18n/request.ts` will render the key string for any
genuinely missing key, so missing translations are safe-by-default.

The i18n keys use the `repositories.firstRun.*` namespace split (not
`repositories.empty.*`) because "first run" describes the user state,
not the UI state. The same component is shown whenever `repos.length === 0`,
so calling it "empty" would be accurate today but misleading if we later
add a different empty state for, e.g., "all repos filtered out".

## Edge cases

| Case | Behavior | Why |
|---|---|---|
| Slow Gitea response | `RepoList`'s `await` blocks render; standard Next.js loading.tsx shows during the wait. No empty-vs-loading race. | RepoList is a server component with a single await. |
| Gitea 401/403 on `/repositories` | `listUserRepos` throws → existing error card renders in RepoList. First-run state NOT shown. | Correct — we don't know if user has 0 repos vs no access. |
| Returning user with all repos deleted | Sees the first-run state again. | Accepted trade-off. Avoiding this would require a session flag — out of scope. |
| Primary CTA + top header "New Repository" button both visible | Both render. Different visual weight (full-width `btn-glow` card vs small top button). | Per spec decision: keep the top header. |
| "Learn more" link target moves / 404s | Browser shows Gitea docs 404. | External link, not our problem. URL is easy to update later. |
| Mobile (375px) | 2-column secondary grid collapses to 1 column via `sm:grid-cols-2`. | Uses standard Tailwind responsive breakpoint. |

## Accessibility

- **Icon** has `aria-hidden="true"` (decorative, screen readers skip)
- **Headline** is `<h2>` — the page's `<h1>` is in the `/repositories` page header ("Repositories"), so the hierarchy is correct
- **All links** are real `<Link>` (Next.js internal) or `<a>` (external) elements — focusable, keyboard-navigable
- **"Learn more"** external link: `target="_blank" rel="noopener"` (and we should consider adding `rel="noopener noreferrer"` for full safety)
- **Color contrast**: primary CTA uses the existing `btn-glow` style, audited for contrast in the login redesign spec
- **No focus traps**, no live regions, no role attributes needed (it's a static presentational surface)
- **Keyboard tab order** naturally follows source order: icon (skipped) → headline (skipped) → primary CTA → secondary card 1 → secondary card 2

## Testing

### E2E tests (add to `apps/web/e2e/repositories.spec.ts`)

```ts
test('first-run empty state shows all 4 actions', async ({ page }) => {
  // Mock or seed an auth session where Gitea returns 0 repos
  await page.goto('/repositories')
  await expect(page.getByRole('heading', { name: /welcome to forge-git/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /create your first repository/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /create an organization/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible()
  // Top header still visible
  await expect(page.getByRole('button', { name: /new repository/i })).toBeVisible()
})

test('primary CTA navigates to new repo page', async ({ page }) => {
  await page.goto('/repositories')
  await page.getByRole('link', { name: /create your first repository/i }).first().click()
  await expect(page).toHaveURL(/\/repositories\/new/)
})

test('learn more card opens in new tab', async ({ page }) => {
  await page.goto('/repositories')
  const learnMore = page.getByRole('link', { name: /learn more/i })
  await expect(learnMore).toHaveAttribute('target', '_blank')
  await expect(learnMore).toHaveAttribute('rel', /noopener/)
})
```

The first test depends on the Gitea mock returning 0 repos. Check
the existing test patterns in `repositories.spec.ts` to see how the
test fixture handles this — likely an `addInitScript` that overrides
`fetch` for the Gitea API, or a dedicated test seed.

### i18n smoke test (add to `repositories.spec.ts` or `auth.spec.ts`)

```ts
test('first-run state renders in all 3 locales', async ({ page }) => {
  for (const locale of ['en', 'es', 'zh']) {
    await page.goto(`/${locale}/repositories`)
    await expect(page.getByRole('heading', { name: /welcome to forge-git/i })).toBeVisible()
  }
})
```

Catches missing translation key breakage. Currently all 3 locales
ship with the same English placeholder, so this test will pass in all
3. If a translation is added later and breaks, this test fails.

### Unit tests

None new. The component is a presentational server component with
no client state. E2E coverage is sufficient. (Same reasoning as the
auth-helper-pages spec's `AuthShell` component.)

### Manual checks (documented in PR, not blocking CI)

- Click the primary CTA — verify `/repositories/new` loads
- Click "Create an organization" — verify `/organizations/new` loads
- Click "Learn more" — verify the new tab opens to `docs.gitea.com`
- Resize to 375px width — verify the 2-up card grid collapses to 1 column
- Sign in with a session that has 1+ repos — verify the first-run state does NOT show
- Tab through the empty state with keyboard — verify focus order is intuitive

## Files touched

| File | Change | Lines |
|---|---|---|
| `apps/web/src/components/first-run-empty-state.tsx` | **NEW** | +~60 |
| `apps/web/src/components/repo-list.tsx` | **MODIFY** (1 branch swap, 2 import removals) | -8 / +2 |
| `apps/web/messages/en.json` | **MODIFY** (add `repositories.firstRun.*` namespace) | +9 |
| `apps/web/messages/es.json` | **MODIFY** (same, English placeholders) | +9 |
| `apps/web/messages/zh.json` | **MODIFY** (same, English placeholders) | +9 |
| `apps/web/e2e/repositories.spec.ts` | **MODIFY** (3 new tests + 1 locale smoke) | +~40 |

## What's NOT in scope

- Welcome wizard / multi-step onboarding flow
- Per-user `firstRunCompleted` session flag
- Personalization (using user name from session in the welcome message)
- Animated illustrations or hero graphics
- "Import from another forge" card (not implemented anywhere in the codebase)
- "Invite teammates" card (requires an org first; would need a combined org+invite flow)
- Migrating the existing hardcoded English strings in `repo-list.tsx` to i18n
  (those are inside the error-message path and the non-empty path; not touched here)
- Visual regression testing
- A11y audit (we follow standard patterns; full WCAG audit is out of scope)
- Translation of `es.json` / `zh.json` (English placeholders per established pattern)
- Empty state for the organizations page (different scope, future work)
- A `loading.tsx` for `/repositories` (current behavior is fine)
- Changes to the auth callback page redirect target (still goes to `/repositories`)

## Open questions for the user

None — all clarifications were resolved during brainstorming:
- "Get to first useful action" (skip welcome ceremony)
- 1 primary CTA + 1 secondary card + 1 "Learn more" link
- Drop "Import from another forge" and "Invite teammates" (not implemented / requires org)
- Keep the top header
- New specialized component (Approach A)
- Stateless "0 repos" detection (no session flag)
