# forge-git: First-Run States on Dashboard, Builds, Organizations — Design Spec

Date: 2026-06-12
Scope: Extend the `/repositories` first-run pattern to three more
       authenticated surfaces: dashboard `/`, `/builds`, and
       `/organizations`. Generalize the underlying component so each
       page composes its own copy, icon, and CTA(s).
Out of scope: welcome wizards, multi-step onboarding, account-creation
              flow on the dashboard, /repositories changes (already
              shipped), per-user persistent "first run done" flags

---

## Overview

The first-run experience we shipped for `/repositories` (commit 4adfdb5)
proved the pattern: a dedicated empty state with one prominent primary
action and a small grid of secondary cards. This spec extends that
pattern to three more pages where brand-new users hit the same problem —
"what do I do now?" — but with a more focused empty state than the
generic `EmptyState` component offers.

The three target pages and the gap each closes:

| Page | Trigger condition | Primary CTA | Secondary cards |
|------|-------------------|-------------|------------------|
| `/` (dashboard, authenticated) | All of `repos`, `pulls`, `issues`, `builds` are empty | "Create your first repository" → `/repositories/new` | "Create an organization", "Learn more" |
| `/builds` | `jobs.length === 0` | "Go to your repositories" → `/repositories` | "What is CI/CD?", "View all repos" |
| `/organizations` | `orgs.length === 0` | "Create your first organization" (button, **reveals inline form**) | "Learn about organizations" |

The pattern stays stateless — same trade-off as `/repositories`: a
returning user with all data deleted sees the welcome again. The
infrastructure for tracking "first run done" can come later.

---

## Goals

1. **Consistent first-run polish across authenticated surfaces.** A new
   user landing anywhere with zero data sees the same level of care, not
   a `EmptyState` placeholder.
2. **Reuse, don't duplicate.** The `FirstRunEmptyState` component is
   generalized so all four pages (repos + 3 new) render the same
   shell — icon, headline, subhead, primary CTA, optional secondary
   grid. Per-page copy lives in i18n namespaces; per-page CTAs are
   composed at the call site.
3. **Inline form for orgs.** Per user decision, the `/organizations`
   primary CTA must NOT navigate away. It reveals the existing
   `CreateOrgForm` inline on the same page.

## Non-Goals

- **No "first run completed" persistence.** Same as `/repositories`.
- **No welcome wizards, modals, or animated transitions.**
- **No changes to `/repositories` first-run.** The existing
  integration is the reference for the new pattern.
- **No translation work for languages beyond en/es/zh.** The app
  already supports three locales; we add keys in all three.

---

## Component Design

### Generalize `FirstRunEmptyState`

Current signature (server component, hardcoded for `/repositories`):

```ts
// apps/web/src/components/first-run-empty-state.tsx
export async function FirstRunEmptyState() {
  const t = await getTranslations('repositories.firstRun')
  // ...renders icon, headline, primary CTA, two secondary cards...
}
```

New signature (server component, takes composition props):

```ts
interface FirstRunEmptyStateProps {
  icon: LucideIcon
  namespace: string                   // e.g. 'builds.firstRun'
  primaryCta: ReactNode                // Link, Button, or <a>
  secondaryCards?: ReactNode           // grid of SecondaryCard
}

export async function FirstRunEmptyState({
  icon: Icon, namespace, primaryCta, secondaryCards,
}: FirstRunEmptyStateProps) {
  const t = await getTranslations(namespace)
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center">
      <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
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

The `SecondaryCard` subcomponent (internal) is exported so callers can
compose their own grid.

### Per-page composition

Each page renders `FirstRunEmptyState` with its own config:

**`/builds/page.tsx`** (server component):
```tsx
<FirstRunEmptyState
  icon={Box}
  namespace="builds.firstRun"
  primaryCta={
    <Button asChild className="w-full h-11 btn-glow">
      <Link href="/repositories" data-testid="builds-first-run-primary-cta">
        {t('primaryCta')} <ArrowRight ... />
      </Link>
    </Button>
  }
  secondaryCards={
    <>
      <SecondaryCard href="https://docs.gitea.com/usage/actions/" icon={BookOpen}
        title={t('secondaryLearnTitle')} description={t('secondaryLearnDesc')} external />
      <SecondaryCard href="/repositories" icon={GitBranch}
        title={t('secondaryBrowseTitle')} description={t('secondaryBrowseDesc')} />
    </>
  }
/>
```

**`/page.tsx`** (server component, dashboard):
- Detect first-run: `dashboard` defined AND
  `dashboard.repos.length === 0` AND
  `dashboard.pulls.length === 0` AND
  `dashboard.issues.length === 0` AND
  `dashboard.builds.length === 0`.
- Render `FirstRunEmptyState` instead of `DashboardStats` +
  `DashboardSections`.
- Primary CTA: same shape as `/builds`, points to `/repositories/new`.
- Secondary cards: same as `/repositories` ("Create an organization",
  "Learn more").

**`/organizations/page.tsx`** (delegated to new client component):
- The page becomes a thin server component that calls
  `OrgsFirstRun` when `orgs.length === 0`.
- `OrgsFirstRun` is a new `'use client'` component holding a
  `useState<boolean>(false)` toggle.
- When `false`: renders `FirstRunEmptyState` with a primary CTA that
  is a `<Button onClick={() => setShowForm(true)}>` (not a Link).
- When `true`: renders a heading + `<CreateOrgForm />` inline.
- Secondary card: "Learn about organizations" → docs link.

### i18n Namespaces

Add three new top-level namespaces, all in en/es/zh:

```jsonc
// apps/web/messages/en.json
{
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
}
```

es and zh get equivalent translations (mirror the existing
`repositories.firstRun` translations for the dashboard entry, since
the copy is identical — we may want to share the keys via a single
namespace, but YAGNI for now).

### Mock Gitea Server Changes

The existing token-based "empty repos" mode in
`apps/web/e2e/mock-gitea-server.ts` (commit 68f9d2c) returns
`[]` for `/api/v1/users/me/repos`. To test the new first-runs, we need
empty responses for builds and orgs too.

Two options:

1. **Extend the empty-repos token scheme.** A token prefix like
   `empty-builds:` returns `[]` from the orgs and builds endpoints too.
2. **Add a second token mode** (e.g. `empty-all:`) for full first-run
   coverage.

We go with **option 2** — a single `empty-all:` mode is the simplest
mock surface for these tests. The existing `empty-repos:` stays for
the `/repositories` test.

---

## Page-by-page Change List

### `/page.tsx` (dashboard)

- Add a "first-run" branch in the authenticated render path. When
  `dashboard` is defined but all four sections are empty, render
  `FirstRunEmptyState` instead of the stats + sections grid.
- Import the new namespace keys.
- The existing "no data" fallback (`Server` icon) is replaced.

### `/builds/page.tsx`

- Move the empty check from `BuildsList` to the page. When
  `jobs.length === 0` (and not a Redis error), render
  `FirstRunEmptyState` from the page; otherwise pass the jobs to
  `BuildsList`. The existing `BuildsList` empty-state branch is
  removed (the page owns the decision now).
- The `<details>` "Trigger Manual Build" form stays open above the
  first-run state — same pattern as `/repositories` (the page header
  stays).

### `/organizations/page.tsx`

- Delegate empty-state rendering to a new `<OrgsFirstRun />` client
  component.
- `OrgsFirstRun` toggles between `FirstRunEmptyState` and
  `CreateOrgForm`.
- The page header ("Organizations" + "New Organization" button) stays
  — the first-run state renders in the same slot as the orgs list.

---

## Testing

### Unit tests (Vitest)

- `first-run-empty-state.test.tsx` (new): renders the headline,
  subhead, primary CTA, and optional secondary cards. Snapshot the
  layout.
- Refactor the existing tests to use the new prop API (the existing
  `/repositories` test passes the namespace + icon as props).
- Update `builds-list.test.tsx` to no longer cover the empty-state
  branch (the page owns it now); the empty branch is covered by the
  new e2e test.
- New: a thin assertion that the i18n messages resolve for all three
  new namespaces across en/es/zh.

### E2E tests (Playwright)

- `e2e/authenticated/dashboard.spec.ts` (new): when authenticated
  user has zero repos/PRs/issues/builds, the dashboard first-run
  renders. Verify headline, primary CTA href, and one secondary
  card.
- `e2e/authenticated/builds.spec.ts` (modify): add a "first-run"
  case using the `empty-all:` mock mode. Verify headline, primary
  CTA points to `/repositories`, secondary card present.
- `e2e/authenticated/organizations.spec.ts` (modify): add a
  "first-run" case. Verify headline. Click primary CTA, verify
  the inline form appears (no navigation).
- Locale smoke test: dashboard first-run renders in en/es/zh
  (cookie-based, same as the existing `/repositories` smoke test).

### Build + typecheck

- `pnpm --filter=@forge-git/web build` clean.
- `pnpm --filter=@forge-git/web test` — 100% pass.
- `npx tsc --noEmit` — no errors.

---

## Implementation Order

1. **Generalize `FirstRunEmptyState`** to accept props. Update the
   existing `/repositories` call site to pass the props. Verify
   existing tests still pass. (Refactor only — no behavior change.)
2. **Add i18n namespaces** for `dashboard.firstRun`, `builds.firstRun`,
   `organizations.firstRun` across en/es/zh.
3. **Add `empty-all:` mode to mock Gitea server.**
4. **`/builds` first-run.** Move the empty check to the page,
   render `FirstRunEmptyState` from the page, drop the empty branch
   from `BuildsList`. Add e2e test.
5. **`/organizations` first-run.** Add `OrgsFirstRun` client
   component. Wire it into the page. Add e2e test.
6. **Dashboard first-run.** Add the empty-all branch in
   `page.tsx`. Add e2e test + locale smoke.
7. **Final verification:** build, typecheck, full unit + e2e suites.

Each step is a small commit. We don't batch.

---

## Open Risks

- **Refactor risk on `FirstRunEmptyState`**: the existing component is
  imported by `RepoList` and tested. The new prop API is a breaking
  change to that import site. The refactor must be done in one commit
  that updates the import site and tests in lockstep. Reviewer should
  verify rendered output is byte-identical to the previous version.
- **Mock server extensibility**: the `empty-all:` mode must not
  regress the existing `empty-repos:` mode. Both should be covered by
  e2e tests.
- **Dashboard detection**: detecting "all four sections empty" is a
  simple conjunction, but the `DashboardSections` already has internal
  "empty list" placeholders. The new branch replaces the whole grid
  to avoid double-empty rendering. Reviewer should verify the
  transition is exclusive (no "first-run + empty RecentList" overlap).
