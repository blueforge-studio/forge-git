# Refactor TODOs — Large File Breakdown

Files > 200 LOC in the forge-git monorepo. Prioritized: TSX first (costly to parse, hold in context), then TS.

---

## Priority 1 — TSX Files ≥ 150 LOC

| # | File | LOC | Issue | Suggested Split |
|---|------|-----|-------|-----------------|
| 1 | `apps/web/src/app/repositories/[owner]/[repo]/page.tsx` | 200 | Server component holds fetch logic, error UI, status badge, and JSX | Extract `RepoHeader` client component (avatar, name, settings link), `BuildStatusBadge` server component, `RepoDangerZone` (delete repo + confirm) |
| 2 | `apps/web/src/app/builds/[id]/page.tsx` | 174 | Mixed concerns: data fetching, relative time helper, status badge mapping, progress bar, logs, timestamps, retry/cancel forms | Extract `JobTimestamps` component, move `relativeTime` + `stateBadgeVariant` to `lib/build-utils.ts`, lean on `BuildLogViewer` + `BuildJobCard` more |
| 3 | `apps/web/src/app/organizations/[name]/page.tsx` | 132 | Org header, repos grid, teams list, members list, sidebar forms all in one server component | Extract `OrgHeader`, `OrgRepos`, `OrgTeams` sub-components; each is ~30 lines |
| 4 | `apps/web/src/app/organizations/[name]/teams/[id]/page.tsx` | 127 | Team header, repos list, members (with add/remove forms), settings (edit/delete) | Extract `TeamHeader`, `TeamRepos`, `TeamSidebar` sub-components |
| 5 | `apps/web/src/app/notifications/page.tsx` | 127 | `timeAgo` helper, `typeBadgeVariant` mapping, notification list + empty state | Extract `NotificationCard` client component (one card per notification with mark-read action), move helpers to `lib/notification-utils.ts` |
| 6 | `apps/web/src/app/builds/page.tsx` | 85 | Server component fetches 4 job queues, handles Redis errors, renders trigger form + list | Near limit — extract `BuildsErrorState` and inline the trigger form differently |
| 7 | `apps/web/src/components/trigger-build-form.tsx` | 117 | 6 inputs, useEffect for prefill, useActionState — large form that's hard to scan | Split into `TriggerBuildFormFields` (pure input group) and `TriggerBuildForm` (wrapper with action state + submit) |
| 8 | `apps/web/src/app/repositories/[owner]/[repo]/pulls/[number]/page.tsx` | 115 | PR detail: title, metadata, body, merge status, PR actions | Extract `PRMetadata`, `PRBody` components; leverage existing `PrActions` client component |
| 9 | `apps/web/src/app/repositories/[owner]/[repo]/issues/[number]/page.tsx` | 114 | Same pattern as PR detail | Extract `IssueMetadata`, `IssueBody` components; leverage `IssueActions` |
| 10 | `apps/web/src/app/settings/page.tsx` | 120 | Profile display + edit form + sign-out + masked token | Extract `ProfileDisplay`, `TokenDisplay` presentational components |

## Priority 2 — TS Files > 200 LOC

| # | File | LOC | Issue | Suggested Split |
|---|------|-----|-------|-----------------|
| 11 | `packages/gitea-bridge/src/index.ts` | 727 | Monolithic: ~30 API functions, ~15 type interfaces, 3 private helpers in one file. Everything in one barrel. | Split by domain: `user.ts` (user CRUD), `repo.ts` (repos + keys), `org.ts` (orgs + members + teams), `pr.ts` (pull requests), `issue.ts` (issues), `release.ts` (releases), `branch.ts` (branches + commits), `search.ts` (search), `notification.ts` (notifications), `webhook.ts` (webhooks), `types.ts` (shared types + GiteaOpts + request helper). Re-export all from `index.ts`. |
| 12 | `packages/cli/src/index.ts` | 347 | Commander CLI with ~8 commands inline | Split by command: `commands/auth.ts` (token generate/verify), `commands/repo.ts`, `commands/org.ts`, `commands/build.ts`. Keep shared setup in `index.ts`. |

## Priority 3 — TSX Files 100–125 LOC

| # | File | LOC | Notes |
|---|------|-----|-------|
| 13 | `apps/web/src/components/build-job-card.tsx` | 107 | Borderline — card is self-contained, fine for now |
| 14 | `apps/web/src/app/repositories/[owner]/[repo]/pulls/new/create-pr-form.tsx` | 105 | Large form — extract branch `Select` logic into own hook/component |
| 15 | `apps/web/src/components/create-repo-form.tsx` | 102 | Form is coherent; could extract `.gitignore` + `license` selects into constants |
| 16 | `apps/web/src/app/repositories/[owner]/[repo]/branches/[name]/page.tsx` | 101 | Same pattern as other detail pages |
| 17 | `apps/web/src/app/repositories/[owner]/[repo]/commits/[ref]/page.tsx` | 103 | Same pattern as other detail pages |
| 18 | `apps/web/src/app/search/page.tsx` | 118 | Search with parallel fetches + two result sections — extract `RepoResults`, `IssueResults` |

---

## Summary

| Priority | Count | Total LOC |
|----------|-------|-----------|
| P1 (TSX ≥ 150) | 10 files | ~1,480 |
| P2 (TS > 200) | 2 files | ~1,074 |
| P3 (TSX 100–125) | 6 files | ~636 |

**Biggest wins by impact:**
1. `gitea-bridge/index.ts` (727 lines) — split into 10 domain files, re-export from index
2. `cli/index.ts` (347 lines) — split into 4 command files
3. `repositories/[owner]/[repo]/page.tsx` (200 lines) — extract 3 sub-components
4. `builds/[id]/page.tsx` (174 lines) — extract helpers + timestamps component

