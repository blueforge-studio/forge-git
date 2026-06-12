# Forge-Git Audit — June 2026

## What's Built

### Packages

| Package | Status | Tests |
|---------|--------|-------|
| `@forge-git/gitea-bridge` | Complete | 11 test files (unit, mock fetch) |
| `@forge-git/deploy-runner` | Functional | 1 test file (lifecycle) |
| `@forge-git/cli` | Functional | None |
| `@forge-git/ui` | Basic | None |

**gitea-bridge** (13 source files): Full coverage — repos, orgs, PRs, issues, users, releases, branches, commits, comments, search, notifications, webhooks, tree/blob, OAuth2. All functions accept `GiteaOpts` ({ token, baseUrl }). Missing: delete release, create/delete branch, compare commits.

**deploy-runner**: Listens on BullMQ `deployments` queue. Clones repos, runs workflow steps (checkout + run commands), uploads artifacts to MinIO, streams logs via Redis pub/sub. Limited to a single hardcoded `test` job — no matrix builds, no real action support beyond `actions/checkout@v4`.

**cli** (`fgit`): 6 commands — init, list, delete, webhook, remote, migrate, token generate. Hardcodes Gitea Docker container name.

**ui** (7 components): Button (7 variants), Badge (5 variants), Input, Label, Textarea, Select (native), cn() utility. Missing: Card, Dialog, Dropdown, Tabs, Table, Avatar, Toast, Skeleton.

### Web App — Routes (38 total)

**Public:** `/` (landing/dashboard, i18n-aware with en/es/zh locales), `/login` (OAuth + PAT), `/search`

**Builds:** `/builds`, `/builds/[id]` — queue list, detail with live SSE log streaming, trigger form, retry/cancel

**Repositories** (18 routes): list, create, detail (overview), file tree, file blob, branches (list + detail), commits (list + detail), issues (list, detail, create), PRs (list, detail, create), releases (list, detail, create), deploy keys, webhooks, branch protection

**Organizations** (6 routes): list, create, detail, profile edit, settings, team detail

**Settings:** `/settings` — profile edit, sign out

**Notifications:** `/notifications` — list, mark read

**Users:** `/users/[username]`

### Web App — API Routes (9)

`/api/auth/authorize`, `/api/auth/callback`, `/api/auth/signout`, `/api/builds/trigger`, `/api/builds/[id]` (PATCH/DELETE), `/api/builds/[id]/logs` (SSE), `/api/notifications/count`, `/api/comments`, `/api/webhooks/gitea`

### Web App — Components (37)

Header, search, theme toggle, notification bell, repo cards/lists, build cards/list/log viewer/log streamer/artifact list/polling/status badge, job timestamps, dashboard stats/sections, trigger build form, empty state, feature grid, org/team forms and sidebars, create repo form, profile display, comment form/list, notification card, connection info, footer, locale selector, landing sections (hero, CTA, how-it-works, pricing, newsletter)

### Web App — Lib (8)

session (HMAC-signed OAuth + PAT), queue (BullMQ), minio (S3 presigned URLs), oauth-config, pkce (Web Crypto), build-utils, dashboard-data, notification-utils, i18n (next-intl v4 — request config, routing, middleware)

### Infrastructure

- **docker-compose.yml**: Gitea, PostgreSQL, Redis, MinIO, deploy-runner
- **docker-compose.dev.yml**: Health checks, minio-init bucket provisioning, deploy-runner under `--profile full`
- **Dockerfiles**: Multi-stage for web (standalone Next.js) and deploy-runner
- **CI/CD**: GitHub Actions + Gitea Actions — test (matrix), build, e2e, docker push (GHCR / Gitea registry)
- **Gitea Actions runner**: `.gitea/runner/docker-compose.runner.yml` with act_runner
- **Scripts**: Cloudflare DNS, Coolify server provisioning

### Tests

- **gitea-bridge**: 11 unit test files (all modules covered, mock fetch)
- **deploy-runner**: 1 test (lifecycle)
- **apps/web**: 31 unit/component test files (183 tests) + 15 Playwright E2E specs (69 tests)
- **CLI**: 0 tests
- **UI**: 0 tests

---

## What's Missing

### High Priority

1. **Actual CI/CD pipeline functionality is minimal**: The deploy-runner only handles a single `test` job with two steps (checkout + run). No matrix builds, no multi-job workflows, no action marketplace, no caching. The `.forge-git.yml` workflow syntax described in README is aspirational — only the basic `jobs.test.steps` array is actually parsed and executed.

2. **No database for forge-git metadata**: PostgreSQL is in docker-compose but unused. Types exist for `ForgeGitOrg`, `ForgeGitMember`, `ForgeGitWorkflow`, `ForgeGitPreview` but have no backing tables, API endpoints, or UI. This means:
   - Organizations created in forge-git don't persist beyond the Gitea org
   - No team management beyond Gitea's native teams
   - No workflow/pipeline customization stored in forge-git
   - No preview environments

3. **No caching layer**: Every page load hits the Gitea API directly. Redis is only used for BullMQ and log streaming. High-traffic endpoints (repo list, issue list) have no cache.

4. **Auth is proxy-only**: No JWT, no API keys, no session expiry/refresh. The OAuth flow works but the cookie is a simple base64-encoded JSON blob with HMAC signature — no rotation, no revocation.

5. **CI/CD pipeline gap**: The webhook receiver (`/api/webhooks/gitea`) triggers builds on push/PR events but only passes `repoId`, `orgId`, `commitSha`, and `branch`. The workflow YAML is not fetched from the repo — it always uses the hardcoded default or a server-side supplied one.

### Medium Priority

6. **Missing routes**: No `/docs`, `/help`, `/admin`, or `/explore` pages. No compare/diff view between commits or branches. No fork UI. No star/watch actions (only stat display).

7. **Missing loading/error boundaries**: ~15 routes missing `loading.tsx`, ~25 routes missing `error.tsx`. Many pages handle errors inline with try/catch JSX fallbacks.

8. **Missing UI components**: No Table, Pagination, Dialog/Modal, Dropdown/Menu, Avatar, Toast/notification, Skeleton loader, Tabs component. The Select uses native `<select>` with no keyboard navigation or custom styling.

9. **E2E tests need a running Gitea**: The Playwright tests check page rendering but likely can't exercise full flows without a configured Gitea instance with test data.

10. **CLI has no tests**: All 5 command files and the auth lib are untested.

### Low Priority

11. **No deploy-runner Git auth**: Clones use public URLs — can't clone private repos without token injection.
12. **No production reverse proxy config**: No NGINX/Traefik/Caddy config for serving the web app behind a domain.
13. **No web app healthcheck endpoint** for Docker/load balancer probes.
14. **No rate limiting** on API routes — the webhook receiver and comment API have no abuse protection.
15. **No pagination on most list pages** — repo list, builds list, notification list all fetch up to a hardcoded limit with no cursor/offset.

---

## Recommendations

### Immediate (this week)

1. **Add a database + Prisma schema** for forge-git metadata (orgs, members, workflows, previews). Wire it to the existing org/team pages so forge-git org membership persists independently of Gitea.

2. **Expand the deploy-runner** to support multi-job workflows and real `uses:` actions. Start with `actions/setup-node`, `pnpm/action-setup`, and `docker/build-push-action` — those cover 80% of real workflows.

3. **Add Redis caching** for repo lists, issue lists, and dashboard data. Use a 30-second TTL with invalidation on webhook events.

### Next

4. **Add loading.tsx and error.tsx** to the 15-25 routes that are missing them. Use shared `<PageLoading />` and `<PageError />` components.

5. **Build the missing UI components**: Table, Dialog, Dropdown, Tabs. These are needed for admin pages, compare views, and better UX on existing pages.

6. **Add CLI tests** covering all 6 commands with mocked exec/API calls.

7. **Add API route tests** for the webhook receiver, build trigger, and comment API.

### Later

8. **Fork/star/watch actions** wired to Gitea's star/watch APIs.
9. **Compare/diff view** between branches and commits.
10. **Admin panel** for site configuration, user management, runner status.
11. **Preview environments** using the existing `ForgeGitPreview` types + Docker Compose templates.
12. **API documentation** for the gitea-bridge package.

---

## Screen Audit Setup

Screen audits capture per-page screenshots, DOM snapshots, and a11y/perf
metrics against a running dev server. They're a sibling to the Playwright
E2E suite — same browser engine, different scope (visual regression vs.
functional assertions).

### Files

```
screen-audit/
├── flow-kit.ts                 # Vendored from @blueforge-studio/audit-init
├── run.mjs                     # Thin dispatch to screen-audit-runner
└── flows/
    ├── site-landing.flow.ts    # Public marketing landing (customized)
    ├── auth-login.flow.ts      # /login — OAuth + PAT (customized)
    ├── auth-signup.flow.ts     # /signup + /forgot-token helpers
    ├── app-public.flow.ts      # /login + /signup smoke
    ├── dashboard.flow.ts       # / — home/dashboard (no /dashboard route exists)
    └── web.flow.ts             # Pre-existing minimal AuditFlow (legacy shape)
```

### Install

```bash
pnpm add -Dw @blueforge-studio/screen-audit \
                 @blueforge-studio/screen-audit-runner \
                 @blueforge-studio/audit-init
```

### Run

```bash
# Full set, desktop, light theme
node screen-audit/run.mjs

# Just the public smoke
node screen-audit/run.mjs --flows site-landing,app-public

# Quick iteration
node screen-audit/run.mjs --flows site-landing --quick --full-page
```

Base URL: `http://localhost:3000` (set via `--base-url` at scaffold time, or
overridden at run time with `--url` or the `APP_URL` env var).

### Customizing flows

The scaffolder emits generic testid placeholders (`login-title`,
`email-input`, `register-link`, etc.). Each flow in `flows/` has been
customized to use the real `data-testid` values from the app:

| Flow | Real testids used |
|------|-------------------|
| `site-landing` | `site-header`, `hero-section`, `hero-heading`, `hero-sign-in-cta`, `feature-grid`, `how-it-works-section`, `pricing-section`, `cta-section`, `newsletter-section`, `site-footer` |
| `auth-login` | `open-token-settings`, `new-here-get-token`, `url-health-pill`, `last-used-hint`, plus attribute selectors `[name="giteaUrl"]` / `[name="token"]` |
| `auth-signup` | `open-token-settings` |
| `app-public` | `open-token-settings` |
| `dashboard` | `appFlow` one-liner — defaults to h1 + main |

When adding new flows or new testids to existing flows:

1. Add `data-testid="<name>"` to the React component.
2. Use the shorthand in flow files: `el("my-id", { name: "..." })` →
   expands to `[data-testid='my-id']`. For attribute or class selectors,
   prefix with `[` / `.` / `#` to opt out of shorthand: `el('[name="x"]')`.
3. Mark below-fold elements with `elBelow()` to trigger scroll, and
   off-screen links/buttons with `elRef()` to skip element capture.

### Known gaps (next iteration)

- The 5 starter flows only cover public/auth surfaces. Authenticated flows
  (dashboard stats, repo tree, file blob, build detail with SSE logs) need
  a `Persona` and a session-cookie bootstrap. See
  `@blueforge-studio/audit-init/flow-kit` `definePersona()`.
- `auth-login` exercises the PAT form in error state. Add a positive-path
  flow that fills a real token from `BLUEFORGE_E2E_TOKEN` and verifies
  the dashboard renders.
- `dashboard.flow.ts` is a one-liner with no testids — flesh out the
  selector list once the dashboard widgets get testids.
- The old `web.flow.ts` (legacy `AuditFlow` type, no flow-kit) should be
  ported to the new factory or deleted once the new flows cover its
  scope.
